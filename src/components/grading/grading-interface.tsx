"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { Loader2, Save, Undo, Eraser, Pen, MousePointer2 } from "lucide-react"; // Added icons
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const PdfViewer = dynamic(() => import("./PdfPageRenderer"), { ssr: false });
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import { TestSubmission } from "@prisma/client";

interface GradingInterfaceProps {
    submission: TestSubmission;
    testSeriesId: string;
    testChapterId: string;
}

// Normalized Point: 0.0 to 1.0
interface Point {
    x: number;
    y: number;
}

interface PathData {
    page: number; // 1-indexed
    points: Point[];
    color: string;
    width: number;
}

const COLORS = [
    { name: "Red", value: "#ff0000" },
    { name: "Green", value: "#00ff00" },
    { name: "Blue", value: "#0000ff" },
    { name: "Black", value: "#000000" },
];

export const GradingInterface = ({
    submission,
    testSeriesId,
    testChapterId
}: GradingInterfaceProps) => {
    const router = useRouter();
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    
    // Grading State
    const [marks, setMarks] = useState(submission.marksAwarded?.toString() || "");
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const [isLoading, setIsLoading] = useState(false);

    // Drawing State
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Paths are stored with NORMALIZED coordinates (0-1)
    const [paths, setPaths] = useState<PathData[]>([]); 
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    
    // Tools
    const [tool, setTool] = useState<"pen" | "eraser">("pen"); // Eraser in this MVP might just be undo, but let's keep structure
    const [currentColor, setCurrentColor] = useState("#ff0000");
    const [currentWidth, setCurrentWidth] = useState(2);

    const { startUpload } = useUploadThing("testSubmission");

    // Dynamic Canvas Resizing
    const resizeCanvas = useCallback(() => {
        const container = containerRef.current;
        const overlayCanvas = canvasRef.current;
        if (!container || !overlayCanvas) return;

        // Try to find the specific page element rendered by @react-pdf-viewer
        // It often uses a class like 'rpv-core__page-layer' or just the canvas/svg inside
        // Since we want the *current* page, we might need to be specific if multiple are in DOM (though usually virtualized)
        
        // Strategy: specific selector for the library's page container
        // Note: The library renders pages with data-testid="core__page-layer" or class "rpv-core__page-layer"
        // We need the one corresponding to the current page if possible, or just the visible one.
        // Given we are mostly single-page view or scrolling, the "visible" one is significant.
        
        let targetElement = container.querySelector('.rpv-core__page-layer') as HTMLElement;
        
        // Fallback: search for canvas that is not our overlay
        if (!targetElement) {
             const canvases = container.querySelectorAll('canvas');
             for (let i = 0; i < canvases.length; i++) {
                 if (canvases[i] !== overlayCanvas) {
                     targetElement = canvases[i] as HTMLElement;
                     break;
                 }
             }
        }

        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Calculate position relative to container
            const top = rect.top - containerRect.top;
            const left = rect.left - containerRect.left;

            overlayCanvas.style.top = `${top}px`;
            overlayCanvas.style.left = `${left}px`;
            overlayCanvas.width = rect.width;
            overlayCanvas.height = rect.height;
            overlayCanvas.style.width = `${rect.width}px`;
            overlayCanvas.style.height = `${rect.height}px`;
        } else {
             // Fallback to container fit if not ready (keeps it usable at least)
            const rect = container.getBoundingClientRect();
            overlayCanvas.style.top = '0px';
            overlayCanvas.style.left = '0px';
            overlayCanvas.width = rect.width;
            overlayCanvas.height = rect.height;
        }
        
        // Trigger re-render of paths
        renderPaths();
    }, [pageNumber, paths]); // Re-bind if dependencies change, though renderPaths handles most

    useEffect(() => {
        window.addEventListener("resize", resizeCanvas);
        // Initial size check after a small delay to ensure PDF viewer has laid out
        const timeout = setTimeout(resizeCanvas, 500);
        return () => {
             window.removeEventListener("resize", resizeCanvas);
             clearTimeout(timeout);
        };
    }, [resizeCanvas]);

    // Force resize when page changes
    useEffect(() => {
        resizeCanvas();
    }, [pageNumber]);

    // Helper: Normalize coordinates (Screen -> 0..1)
    const getNormalizedPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        };
    };

    // Helper: Denormalize coordinates (0..1 -> Screen)
    const denormalize = (p: Point, width: number, height: number): Point => ({
        x: p.x * width,
        y: p.y * height
    });

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === "eraser") return; // Implement eraser logic later or assume just undo for now
        setIsDrawing(true);
        const point = getNormalizedPoint(e);
        setCurrentPoints([point]);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        
        const point = getNormalizedPoint(e);
        setCurrentPoints(prev => [...prev, point]);

        // Visual feedback (immediate draw)
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const prevPointNorm = currentPoints[currentPoints.length - 1];

        if (prevPointNorm) {
            const prev = denormalize(prevPointNorm, rect.width, rect.height);
            const curr = denormalize(point, rect.width, rect.height);
            
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentPoints.length > 0) {
            setPaths(prev => [...prev, {
                page: pageNumber,
                points: currentPoints,
                color: currentColor,
                width: currentWidth
            }]);
        }
        setCurrentPoints([]);
    };

    const renderPaths = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pagePaths = paths.filter(p => p.page === pageNumber);

        pagePaths.forEach(pathData => {
            if (pathData.points.length < 2) return;

            ctx.beginPath();
            const start = denormalize(pathData.points[0], canvas.width, canvas.height);
            ctx.moveTo(start.x, start.y);

            for (let i = 1; i < pathData.points.length; i++) {
                const p = denormalize(pathData.points[i], canvas.width, canvas.height);
                ctx.lineTo(p.x, p.y);
            }
            
            ctx.strokeStyle = pathData.color;
            ctx.lineWidth = pathData.width;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        });
    };

    // Re-render when paths or page changes
    useEffect(() => {
        renderPaths();
    }, [paths, pageNumber]);


    // Undo last stroke on current page
    const handleUndo = () => {
        setPaths(prev => {
            const current = [...prev];
            // Find last path index for this page
            let lastIdx = -1;
            for(let i = current.length - 1; i >= 0; i--) {
                if (current[i].page === pageNumber) {
                    lastIdx = i;
                    break;
                }
            }
            if (lastIdx > -1) {
                current.splice(lastIdx, 1);
            }
            return current;
        });
    };

    // Clear current page
    const handleClearPage = () => {
         setPaths(prev => prev.filter(p => p.page !== pageNumber));
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            let finalPdfUrl = submission.annotatedPdfUrl;

            // Only process if we have new paths
            console.log("handleSave called. Paths:", paths.length, paths);
            if (paths.length > 0) {
                toast.loading("Processing PDF annotations...");

                // 1. Fetch original PDF (or the latest annotated version if it exists)
                const pdfSource = submission.annotatedPdfUrl || submission.pdfUrl;
                console.log("Fetching PDF from:", pdfSource);
                const existingPdfBytes = await fetch(pdfSource).then(res => res.arrayBuffer());
                console.log("PDF fetched, bytes:", existingPdfBytes.byteLength);

                // 2. Load into pdf-lib
                const pdfDoc = await PDFDocument.load(existingPdfBytes);
                const pages = pdfDoc.getPages();
                console.log("PDF loaded, pages:", pages.length);

                // 3. Draw paths
                paths.forEach((pathOp, idx) => {
                    const pageIndex = pathOp.page - 1;
                    if (pageIndex < 0 || pageIndex >= pages.length) {
                        console.warn("Skipping path on invalid page index:", pageIndex);
                        return;
                    }

                    const page = pages[pageIndex];
                    const { width, height } = page.getSize();
                    console.log(`Drawing path ${idx} on page ${pageIndex + 1}. Page size: ${width}x${height}`);

                    // Map 0..1 coordinates to PDF Page dimensions
                    const points = pathOp.points.map(p => ({
                        x: p.x * width,
                        y: height - (p.y * height) // Invert Y (PDF 0 is bottom)
                    }));

                    if (points.length > 1) {
                         // Convert hex to rgb (0-1)
                         const r = parseInt(pathOp.color.slice(1, 3), 16) / 255;
                         const g = parseInt(pathOp.color.slice(3, 5), 16) / 255;
                         const b = parseInt(pathOp.color.slice(5, 7), 16) / 255;

                          // Draw lines explicitly
                         for (let i = 0; i < points.length - 1; i++) {
                             page.drawLine({
                                 start: points[i],
                                 end: points[i + 1],
                                 color: rgb(r, g, b),
                                 thickness: pathOp.width,
                                 opacity: 1,
                             });
                         }
                    }
                });

                // 4. Save and Upload
                const pdfBytes = await pdfDoc.save();
                console.log("Modified PDF saved, bytes:", pdfBytes.byteLength);
                
                const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
                const file = new File([blob], `graded-${submission.id}.pdf`, { type: "application/pdf" });

                const uploadRes = await startUpload([file]);
                console.log("Upload response:", uploadRes);

                if (!uploadRes || !uploadRes[0]) {
                    throw new Error("Upload failed");
                }

                finalPdfUrl = uploadRes[0].url;
                console.log("Final PDF URL:", finalPdfUrl);
                toast.success("Annotations burned to PDF!");
            } else {
                console.log("No new paths to save.");
            }

            // Update Database
            await axios.patch(`/api/submissions/${submission.id}`, {
                marksAwarded: parseFloat(marks),
                feedback,
                annotatedPdfUrl: finalPdfUrl,
                status: "REVIEWED"
            });

            toast.success("Grading saved successfully");
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong saving grading");
        } finally {
            setIsLoading(false);
            toast.dismiss();
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-screen p-6">
            
            {/* Left Column: Canvas/PDF */}
            <div className="md:col-span-2 flex flex-col gap-4">
                
                {/* Branding / Header */}
                <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold">Submission Viewer</h2>
                     <div className="flex items-center gap-2">
                        {/* Pagination */}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(prev => prev - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
                        <Button
                             variant="outline"
                             size="sm"
                            disabled={pageNumber >= numPages}
                            onClick={() => setPageNumber(prev => prev + 1)}
                        >
                            Next
                        </Button>
                     </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white p-2 rounded-md shadow border flex items-center flex-wrap gap-4">
                     <div className="flex items-center gap-1 border-r pr-4">
                        {COLORS.map((c) => (
                             <button
                                key={c.name}
                                onClick={() => setCurrentColor(c.value)}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                    currentColor === c.value ? "border-slate-800 scale-110 ring-2 ring-offset-1 ring-slate-400" : "border-transparent"
                                )}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                             />
                        ))}
                     </div>

                     <div className="flex items-center gap-2 border-r pr-4">
                         <span className="text-xs font-medium text-slate-500">Width:</span>
                         <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={currentWidth} 
                            onChange={(e) => setCurrentWidth(parseInt(e.target.value))}
                            className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                         />
                         <span className="text-xs w-4">{currentWidth}px</span>
                     </div>

                     <div className="flex items-center gap-2">
                         <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUndo}
                            title="Undo last stroke (Ctrl+Z)"
                         >
                            <Undo className="h-4 w-4 mr-2" />
                            Undo
                         </Button>
                         <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearPage}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                         >
                            <Eraser className="h-4 w-4 mr-2" />
                            Clear Page
                         </Button>
                     </div>
                </div>

                {/* Main Canvas Area */}
                <div className="bg-slate-100 p-4 rounded-md overflow-hidden flex flex-col items-center min-h-[800px] relative border shadow-inner">
                    <div className="relative shadow-lg bg-white" ref={containerRef} style={{ width: '100%', maxWidth: '800px' }}>
                        
                        <div className="relative">
                            <PdfViewer
                                fileUrl={submission.annotatedPdfUrl || submission.pdfUrl}
                                pageNumber={pageNumber}
                                onLoad={({ numPages }: any) => { setNumPages(numPages); resizeCanvas(); }}
                                onPageChange={setPageNumber}
                            />
                            
                            {/* Overlay Canvas */}
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 cursor-crosshair z-20 touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    const mouseEvent = new MouseEvent("mousedown", {
                                        clientX: touch.clientX,
                                        clientY: touch.clientY
                                    });
                                    startDrawing(mouseEvent as any);
                                }}
                                onTouchMove={(e) => {
                                    const touch = e.touches[0];
                                    const mouseEvent = new MouseEvent("mousemove", {
                                        clientX: touch.clientX,
                                        clientY: touch.clientY
                                    });
                                    draw(mouseEvent as any);
                                }}
                                onTouchEnd={stopDrawing}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                }}
                            />
                        </div>

                    </div>
                    <p className="text-xs text-slate-400 mt-2">Whiteboard Overlay Active • PDF Rendering via PDF.js</p>
                </div>
            </div>

            {/* Right Column: Grading Form */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-md border shadow-sm sticky top-6">
                    <h2 className="text-xl font-bold mb-4">Grading & Feedback</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Marks Awarded</label>
                            <Input
                                type="number"
                                value={marks}
                                onChange={(e) => setMarks(e.target.value)}
                                placeholder="Enter marks"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Feedback</label>
                            <Textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Enter detailed feedback..."
                                className="min-h-[200px]"
                            />
                        </div>

                        <div className="text-sm text-muted-foreground p-3 bg-slate-50 rounded border">
                            <p><strong>Current Status:</strong> <span className="font-semibold">{submission.status}</span></p>
                            {submission.annotatedPdfUrl && (
                                <a href={submission.annotatedPdfUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline text-xs mt-2 flex items-center">
                                    <MousePointer2 className="w-3 h-3 mr-1" />
                                    View Previous Annotated PDF
                                </a>
                            )}
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Grading & Annotations
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GradingInterface;
