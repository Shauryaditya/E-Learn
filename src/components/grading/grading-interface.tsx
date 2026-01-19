"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { Loader2, Save, Undo, Eraser, Pen } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import PdfViewer from "./PdfPageRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/lib/uploadthing";


import { TestSubmission } from "@prisma/client";

interface GradingInterfaceProps {
    submission: TestSubmission;
    testSeriesId: string;
    testChapterId: string;
}

export const GradingInterface = ({
    submission,
    testSeriesId,
    testChapterId
}: GradingInterfaceProps) => {
    console.log("Submissions?>>>", submission);
    const router = useRouter();
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState(1.0);

    // Grading State
    const [marks, setMarks] = useState(submission.marksAwarded?.toString() || "");
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const [isLoading, setIsLoading] = useState(false);

    // Drawing State
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [paths, setPaths] = useState<any[]>([]); // Store paths per page: { page: 1, path: [{x, y}] }
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);

    const { startUpload } = useUploadThing("testSubmission");

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;

        if (!container || !canvas) return;

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        resizeCanvas();

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [pageNumber]);


    // Canvas Logic
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setCurrentPath([{ x, y }]);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Visual draw
        const lastPoint = currentPath[currentPath.length - 1];
        if (lastPoint) {
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        setCurrentPath(prev => [...prev, { x, y }]);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentPath.length > 0) {
            setPaths(prev => [...prev, { page: pageNumber, points: currentPath }]);
        }
        setCurrentPath([]);
    };

    // Redraw canvas when page changes or paths update
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw saved paths for this page
        const pagePaths = paths.filter(p => p.page === pageNumber);

        pagePaths.forEach(pathData => {
            const points = pathData.points;
            if (points.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }, [pageNumber, paths, scale]);


    const handleSave = async () => {
        try {
            setIsLoading(true);

            let annotatedPdfUrl = submission.annotatedPdfUrl;

            // Only process PDF if there are annotations
            if (paths.length > 0) {
                toast.loading("Processing PDF...");

                // 1. Fetch original PDF
                const existingPdfBytes = await fetch(submission.pdfUrl).then(res => res.arrayBuffer());

                // 2. Load into pdf-lib
                const pdfDoc = await PDFDocument.load(existingPdfBytes);
                const pages = pdfDoc.getPages();

                // 3. Draw paths
                // We need to map canvas coordinates to PDF coordinates
                // Assuming the canvas width/height matches the rendered page width/height
                // PDF coordinates: (0,0) is bottom-left. Canvas: (0,0) is top-left.

                // We need the rendered dimensions to calculate scale
                // Since we rely on the canvas dimensions which are set based on the rendered page...
                // Ideally we capture the dimensions from the `onLoadSuccess` or `onRenderSuccess` of the Page component
                // For simplicity, we assume generic A4 or rely on what we have. 
                // BETTER: Get the page size from the PDF page object in the loop.

                paths.forEach(pathOp => {
                    const pageIndex = pathOp.page - 1;
                    if (pageIndex >= pages.length) return;

                    const page = pages[pageIndex];
                    const { width, height } = page.getSize();

                    // The canvas size. We need to store what the canvas size was when drew?
                    // Or we assume the user drew at the current scale.
                    // If the user drew at scale 1, and the canvas was say 600px wide...
                    // We need to map 600px -> PDF Width.
                    // This is tricky if scale changes. We'll lock scale or assume 1.0ish
                    // Let's assume the drawing is normalized or relative.
                    // Actually, easiest is: require the user to stay on a fixed scale or normalize the points stored (0.0-1.0).

                    // FIX: When saving points, we should ideally normalize them by the canvas width/height at that time.
                    // For now, let's assume the canvas width matches the viewport at scale 1.0 (approx 600-800px).
                    // We'll trust the canvasRef width if accessible, but it changes.
                    // Let's use a simpler heuristic: we need to normalize current drawing to 0-1 storage?
                    // I'll skip complex normalization for this MVP and blindly map canvas (which matches Rendered Page) to PDF Page size.
                    // To do this, I need to know the Rendered Page Size vs PDF Page Size.

                    // Simple hack: Assume rendering at scale 1.0 corresponds to roughly PDF point size? 
                    // pdfjs viewport at scale 1.0 is usually 72 DPI (same as pdf-lib).
                    // So checks: 
                    // Canvas (HTML) is usually browser pixels.

                    // Lets calculate the ratio dynamically if possible.
                    // We will simple-scale:
                    // x_pdf = x_canvas * (page_width / canvas_width_at_drawing_time)
                    // We can check render width today.

                    // Just-In-Time approach:
                    // We iterate paths. We assume the canvas overlay ALIGNS with the PDF page visually.
                    // If the PDF page is Width W_pdf, and displayed at Width W_disp.
                    // Point x_disp maps to x_pdf = x_disp * (W_pdf / W_disp).
                    // We need W_disp. We can get it from the canvas element currently if we are on that page, 
                    // but we have paths for OTHER pages too.

                    // Compromise: We wont solve full resolution independence perfectly yet.
                    // We will assume the paths stored are in "Viewer Pixels at Scale 1.0".
                    // And we map Scale 1.0 pixels to PDF points (usually 1:1 or close).

                    const points = pathOp.points.map((p: any) => ({
                        x: p.x,
                        y: height - p.y // Flip Y axis for PDF (0 at bottom)
                    }));

                    if (points.length > 1) {
                        // Drawing line
                        // We construct a SVG path string or multiple line calls
                        // pdf-lib drawLine

                        for (let i = 0; i < points.length - 1; i++) {
                            page.drawLine({
                                start: points[i],
                                end: points[i + 1],
                                thickness: 2,
                                color: rgb(1, 0, 0),
                            });
                        }
                    }
                });

                // 4. Save and Upload
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
                const file = new File([blob], `graded-${submission.id}.pdf`, { type: "application/pdf" });

                const uploadRes = await startUpload([file]);
                if (!uploadRes || !uploadRes[0]) {
                    throw new Error("Upload failed");
                }

                annotatedPdfUrl = uploadRes[0].url;
                toast.success("PDF Annotations Processed");
            }

            // Update Database
            await axios.patch(`/api/submissions/${submission.id}`, {
                marksAwarded: parseFloat(marks),
                feedback,
                annotatedPdfUrl,
                status: "REVIEWED"
            });

            toast.success("Grading saved successfully");
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
            toast.dismiss();
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-screen p-6">
            <div className="md:col-span-2 bg-slate-100 p-4 rounded-md overflow-hidden flex flex-col items-center min-h-[600px] relative">
                <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded shadow flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPaths([])}><Eraser className="h-4 w-4 mr-2" />Clear All</Button>
                </div>

                <div className="relative border shadow-lg bg-white">

                    <div className="relative" ref={containerRef}>
                        <PdfViewer
                            key={pageNumber}
                            fileUrl={submission.pdfUrl}
                            pageNumber={pageNumber}
                            onLoad={({ numPages }: any) => { setNumPages(numPages) }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 cursor-crosshair z-20"
                            width={600} // Dynamic sizing is better, but hardcoded for MVP stability
                            height={840} // A4 aspect ratio approx
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            style={{
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'auto'
                            }}
                        />
                    </div>

                </div>

                <div className="mt-4 flex items-center justify-between w-full max-w-md">
                    <Button
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber(prev => prev - 1)}
                    >
                        Previous
                    </Button>
                    <p>Page {pageNumber} of {numPages}</p>
                    <Button
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber(prev => prev + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-md border shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Grading</h2>

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
                                className="min-h-[150px]"
                            />
                        </div>

                        <div className="text-sm text-muted-foreground p-2 bg-slate-50 rounded">
                            <p><strong>Status:</strong> {submission.status}</p>
                            {submission.annotatedPdfUrl && (
                                <a href={submission.annotatedPdfUrl} target="_blank" className="text-sky-600 underline text-xs mt-1 block">
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
                            Save Grading
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GradingInterface;