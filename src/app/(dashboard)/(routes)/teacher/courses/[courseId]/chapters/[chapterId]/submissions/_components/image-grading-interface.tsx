"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Save, Undo, Eraser, MousePointer2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import { ChapterSubmission } from "@prisma/client";

interface ImageGradingInterfaceProps {
    submission: ChapterSubmission;
    courseId: string;
    chapterId: string;
}

interface Point { x: number; y: number; }
interface PathData {
    imageIndex: number;
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

export const ImageGradingInterface = ({ submission, courseId, chapterId }: ImageGradingInterfaceProps) => {
    const router = useRouter();
    const [imageIndex, setImageIndex] = useState(0);
    const numImages = submission.images.length;
    
    // Grading State
    const [status, setStatus] = useState(submission.status);
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const [isLoading, setIsLoading] = useState(false);

    // Initial state setup for annotated image tracking
    const [annotatedImages, setAnnotatedImages] = useState<string[]>(
        submission.annotatedImages.length > 0 ? [...submission.annotatedImages] : [...submission.images]
    );

    // Drawing State
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const [paths, setPaths] = useState<PathData[]>([]); 
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    
    // Tools
    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const [currentColor, setCurrentColor] = useState("#ff0000");
    const [currentWidth, setCurrentWidth] = useState(4);

    const { startUpload } = useUploadThing("chapterSubmission");

    const renderPaths = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pagePaths = paths.filter(p => p.imageIndex === imageIndex);

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
    }, [paths, imageIndex]);

    const resizeCanvas = useCallback(() => {
        const container = containerRef.current;
        const overlayCanvas = canvasRef.current;
        const img = imgRef.current;
        
        if (!container || !overlayCanvas || !img) return;

        const rect = img.getBoundingClientRect();
        
        overlayCanvas.width = rect.width;
        overlayCanvas.height = rect.height;
        overlayCanvas.style.width = `${rect.width}px`;
        overlayCanvas.style.height = `${rect.height}px`;
        
        renderPaths();
    }, [renderPaths]);

    useEffect(() => {
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [resizeCanvas]);

    useEffect(() => {
        resizeCanvas();
    }, [imageIndex, resizeCanvas]);

    const getNormalizedPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    };

    const denormalize = (p: Point, width: number, height: number): Point => ({
        x: p.x * width,
        y: p.y * height
    });

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setIsDrawing(true);
        const point = getNormalizedPoint(e);
        setCurrentPoints([point]);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing) return;
        
        const point = getNormalizedPoint(e);
        setCurrentPoints(prev => [...prev, point]);

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
                imageIndex,
                points: currentPoints,
                color: currentColor,
                width: currentWidth
            }]);
        }
        setCurrentPoints([]);
    };

    const handleUndo = () => {
        setPaths(prev => {
            const current = [...prev];
            let lastIdx = -1;
            for(let i = current.length - 1; i >= 0; i--) {
                if (current[i].imageIndex === imageIndex) {
                    lastIdx = i;
                    break;
                }
            }
            if (lastIdx > -1) current.splice(lastIdx, 1);
            return current;
        });
    };

    const handleClearPage = () => {
         setPaths(prev => prev.filter(p => p.imageIndex !== imageIndex));
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            toast.loading("Processing image annotations...");
            
            let finalAnnotatedImages = [...annotatedImages];
            
            // For each image that has annotations, create a composite blob
            for (let i = 0; i < numImages; i++) {
                const imagePaths = paths.filter(p => p.imageIndex === i);
                if (imagePaths.length > 0) {
                    // We need to render the original image + paths on a temporary canvas to upload it
                    const tempCanvas = document.createElement("canvas");
                    const ctx = tempCanvas.getContext("2d");
                    if (!ctx) continue;
                    
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = annotatedImages[i]; // Load last annotated state or original
                    await new Promise(res => img.onload = res);
                    
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // Draw paths scaled to intrinsic image dimensions
                    imagePaths.forEach(pathData => {
                        if (pathData.points.length < 2) return;
                        ctx.beginPath();
                        const start = denormalize(pathData.points[0], tempCanvas.width, tempCanvas.height);
                        ctx.moveTo(start.x, start.y);

                        for (let j = 1; j < pathData.points.length; j++) {
                            const p = denormalize(pathData.points[j], tempCanvas.width, tempCanvas.height);
                            ctx.lineTo(p.x, p.y);
                        }
                        
                        ctx.strokeStyle = pathData.color;
                        // Scale the brush width relatively
                        ctx.lineWidth = pathData.width * (tempCanvas.width / (imgRef.current?.width || 800));
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        ctx.stroke();
                    });
                    
                    const blob = await new Promise<Blob | null>(resolve => tempCanvas.toBlob(resolve, "image/png"));
                    if (blob) {
                        const file = new File([blob], `annotated-${submission.id}-${i}.png`, { type: "image/png" });
                        const uploadRes = await startUpload([file]);
                        if (uploadRes && uploadRes[0]) {
                            finalAnnotatedImages[i] = uploadRes[0].url;
                        }
                    }
                }
            }

            const updatedStatus = "REVIEWED";

            await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/submissions/${submission.id}`, {
                annotatedImages: finalAnnotatedImages,
                status: updatedStatus,
                feedback
            });
            
            setAnnotatedImages(finalAnnotatedImages);
            setStatus(updatedStatus);
            setPaths([]); // Clear paths for freshly saved images to prevent re-saving the same paths
            toast.success("Annotations saved successfully");
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong saving annotations");
        } finally {
            setIsLoading(false);
            toast.dismiss();
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-screen p-6">
            <div className="md:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold">Image Annotation</h2>
                     <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Button variant="outline" size="sm" disabled={imageIndex <= 0} onClick={() => setImageIndex(prev => prev - 1)}>
                            Previous
                        </Button>
                        <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-[300px] scrollbar-thin pb-1">
                            {Array.from({ length: numImages }).map((_, idx) => (
                                <Button
                                    key={idx}
                                    variant={imageIndex === idx ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 w-8 min-w-[32px] p-0"
                                    onClick={() => setImageIndex(idx)}
                                >
                                    {idx + 1}
                                </Button>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" disabled={imageIndex >= numImages - 1} onClick={() => setImageIndex(prev => prev + 1)}>
                            Next
                        </Button>
                     </div>
                </div>

                <div className="bg-white p-2 rounded-md shadow border flex items-center flex-wrap gap-4">
                     <div className="flex items-center gap-1 border-r pr-4">
                        {COLORS.map((c) => (
                             <button
                                key={c.name}
                                onClick={() => setCurrentColor(c.value)}
                                className={cn("w-6 h-6 rounded-full border-2 transition-all hover:scale-110", currentColor === c.value ? "border-slate-800 scale-110 ring-2 ring-offset-1 ring-slate-400" : "border-transparent")}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                             />
                        ))}
                     </div>
                     <div className="flex items-center gap-2 border-r pr-4">
                         <span className="text-xs font-medium text-slate-500">Width:</span>
                         <input type="range" min="1" max="15" value={currentWidth} onChange={(e) => setCurrentWidth(parseInt(e.target.value))} className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                     </div>
                     <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" onClick={handleUndo} title="Undo last stroke">
                            <Undo className="h-4 w-4 mr-2" /> Undo
                         </Button>
                         <Button variant="ghost" size="sm" onClick={handleClearPage} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Eraser className="h-4 w-4 mr-2" /> Clear Image
                         </Button>
                     </div>
                </div>

                <div className="bg-slate-100 p-4 rounded-md overflow-auto flex flex-col items-center min-h-[500px] border shadow-inner">
                    <div className="relative inline-block max-w-full" ref={containerRef}>
                        <img 
                            ref={imgRef} 
                            src={annotatedImages[imageIndex]} 
                            alt={`Submission Image ${imageIndex + 1}`} 
                            className="max-w-full h-auto pointer-events-none select-none shadow-lg"
                            onLoad={(e) => resizeCanvas()}
                            crossOrigin="anonymous"
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 cursor-crosshair z-20 touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-md border shadow-sm sticky top-6">
                    <h2 className="text-xl font-bold mb-4">Grading Status</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Remarks / Feedback</label>
                            <Textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Enter detailed feedback for the student..."
                                className="mt-1 min-h-[150px]"
                            />
                        </div>
                        <div className="text-sm text-muted-foreground p-3 bg-slate-50 rounded border">
                            <p><strong>Current Status:</strong> <span className="font-semibold text-sky-700">{status}</span></p>
                            <p className="mt-2 text-xs">Annotate images on the left. Once you hit Save, any drawn paths will be permanently merged into the images.</p>
                        </div>
                        <Button className="w-full" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Annotations
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
