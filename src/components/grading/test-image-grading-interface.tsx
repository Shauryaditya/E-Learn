"use client";

import axios from "axios";
import { Eraser, Loader2, Save, Undo } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { TestSubmission } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";

interface TestImageGradingInterfaceProps {
    submission: TestSubmission;
}

interface Point {
    x: number;
    y: number;
}

interface PathData {
    imageIndex: number;
    points: Point[];
    color: string;
    width: number;
}

const COLORS = [
    { name: "Red", value: "#ff0000" },
    { name: "Green", value: "#00a63e" },
    { name: "Blue", value: "#155dfc" },
    { name: "Black", value: "#000000" },
];

const denormalize = (point: Point, width: number, height: number): Point => ({
    x: point.x * width,
    y: point.y * height,
});

export const TestImageGradingInterface = ({ submission }: TestImageGradingInterfaceProps) => {
    const router = useRouter();
    const { startUpload } = useUploadThing("testSubmission");
    const imageSources = submission.images.map(
        (image, index) => submission.annotatedImages[index] || image
    );

    const [imageIndex, setImageIndex] = useState(0);
    const [annotatedImages, setAnnotatedImages] = useState(imageSources);
    const [marks, setMarks] = useState(submission.marksAwarded?.toString() || "");
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const [isSaving, setIsSaving] = useState(false);
    const [paths, setPaths] = useState<PathData[]>([]);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState(COLORS[0].value);
    const [currentWidth, setCurrentWidth] = useState(4);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const renderPaths = useCallback(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        paths
            .filter((path) => path.imageIndex === imageIndex)
            .forEach((path) => {
                if (path.points.length < 2) return;

                context.beginPath();
                const firstPoint = denormalize(path.points[0], canvas.width, canvas.height);
                context.moveTo(firstPoint.x, firstPoint.y);

                path.points.slice(1).forEach((point) => {
                    const nextPoint = denormalize(point, canvas.width, canvas.height);
                    context.lineTo(nextPoint.x, nextPoint.y);
                });

                context.strokeStyle = path.color;
                context.lineWidth = path.width * canvas.width;
                context.lineCap = "round";
                context.lineJoin = "round";
                context.stroke();
            });
    }, [imageIndex, paths]);

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        const rect = image.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        renderPaths();
    }, [renderPaths]);

    useEffect(() => {
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [resizeCanvas]);

    useEffect(() => {
        resizeCanvas();
    }, [imageIndex, resizeCanvas]);

    const getPoint = (
        event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const pointer = "touches" in event ? event.touches[0] : event;

        return {
            x: (pointer.clientX - rect.left) / rect.width,
            y: (pointer.clientY - rect.top) / rect.height,
        };
    };

    const startDrawing = (
        event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        event.preventDefault();
        setIsDrawing(true);
        setCurrentPoints([getPoint(event)]);
    };

    const draw = (
        event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        event.preventDefault();
        if (!isDrawing) return;

        const point = getPoint(event);
        const previousPoint = currentPoints[currentPoints.length - 1];
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (canvas && context && previousPoint) {
            const previous = denormalize(previousPoint, canvas.width, canvas.height);
            const current = denormalize(point, canvas.width, canvas.height);
            context.beginPath();
            context.moveTo(previous.x, previous.y);
            context.lineTo(current.x, current.y);
            context.strokeStyle = currentColor;
            context.lineWidth = currentWidth;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.stroke();
        }

        setCurrentPoints((points) => [...points, point]);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;

        setIsDrawing(false);
        if (currentPoints.length > 1) {
            const normalizedWidth = currentWidth / (canvasRef.current?.width || 1);
            setPaths((existingPaths) => [
                ...existingPaths,
                {
                    imageIndex,
                    points: currentPoints,
                    color: currentColor,
                    width: normalizedWidth,
                },
            ]);
        }
        setCurrentPoints([]);
    };

    const undo = () => {
        setPaths((existingPaths) => {
            const lastPathIndex = existingPaths.findLastIndex(
                (path) => path.imageIndex === imageIndex
            );
            return lastPathIndex < 0
                ? existingPaths
                : existingPaths.filter((_, index) => index !== lastPathIndex);
        });
    };

    const loadImage = (source: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("Could not load an answer-sheet image"));
            image.src = source;
        });

    const save = async () => {
        const loadingToast = toast.loading("Saving grading and image annotations...");
        try {
            setIsSaving(true);
            const finalImages = [...annotatedImages];

            for (let index = 0; index < submission.images.length; index += 1) {
                const imagePaths = paths.filter((path) => path.imageIndex === index);
                if (imagePaths.length === 0) continue;

                const sourceImage = await loadImage(finalImages[index] || submission.images[index]);
                const outputCanvas = document.createElement("canvas");
                const context = outputCanvas.getContext("2d");
                if (!context) throw new Error("Could not prepare the annotated image");

                outputCanvas.width = sourceImage.naturalWidth || sourceImage.width;
                outputCanvas.height = sourceImage.naturalHeight || sourceImage.height;
                context.drawImage(sourceImage, 0, 0, outputCanvas.width, outputCanvas.height);

                imagePaths.forEach((path) => {
                    if (path.points.length < 2) return;

                    context.beginPath();
                    const firstPoint = denormalize(path.points[0], outputCanvas.width, outputCanvas.height);
                    context.moveTo(firstPoint.x, firstPoint.y);
                    path.points.slice(1).forEach((point) => {
                        const nextPoint = denormalize(point, outputCanvas.width, outputCanvas.height);
                        context.lineTo(nextPoint.x, nextPoint.y);
                    });
                    context.strokeStyle = path.color;
                    context.lineWidth = path.width * outputCanvas.width;
                    context.lineCap = "round";
                    context.lineJoin = "round";
                    context.stroke();
                });

                const blob = await new Promise<Blob>((resolve, reject) => {
                    outputCanvas.toBlob(
                        (result) => result ? resolve(result) : reject(new Error("Could not export an annotation")),
                        "image/png"
                    );
                });
                const uploadResult = await startUpload([
                    new File([blob], `graded-${submission.id}-${index + 1}.png`, { type: "image/png" }),
                ]);

                if (!uploadResult?.[0]?.url) throw new Error("Could not upload an annotated image");
                finalImages[index] = uploadResult[0].url;
            }

            const numericMarks = marks.trim() === "" ? null : Number(marks);
            if (numericMarks !== null && !Number.isFinite(numericMarks)) {
                throw new Error("Marks must be a valid number");
            }

            await axios.patch(`/api/submissions/${submission.id}`, {
                annotatedImages: finalImages,
                marksAwarded: numericMarks,
                feedback,
                status: "REVIEWED",
            });

            setAnnotatedImages(finalImages);
            setPaths([]);
            toast.dismiss(loadingToast);
            toast.success("Grading and annotations saved");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error(error instanceof Error ? error.message : "Could not save annotations");
        } finally {
            setIsSaving(false);
        }
    };

    if (submission.images.length === 0) {
        return <div className="p-6 text-sm text-muted-foreground">No submission images were found.</div>;
    }

    return (
        <div className="grid min-h-screen grid-cols-1 gap-6 p-4 lg:grid-cols-3 lg:p-6">
            <div className="flex flex-col gap-4 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Image Annotation</h1>
                        <p className="text-sm text-muted-foreground">
                            Answer sheet {imageIndex + 1} of {submission.images.length}
                        </p>
                    </div>
                    <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
                        <Button variant="outline" size="sm" disabled={imageIndex === 0} onClick={() => setImageIndex((index) => index - 1)}>
                            Previous
                        </Button>
                        {submission.images.map((_, index) => (
                            <Button
                                key={index}
                                variant={imageIndex === index ? "default" : "outline"}
                                size="sm"
                                className="h-8 min-w-8 p-0"
                                onClick={() => setImageIndex(index)}
                            >
                                {index + 1}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={imageIndex === submission.images.length - 1}
                            onClick={() => setImageIndex((index) => index + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-md border bg-white p-2 shadow-sm">
                    <div className="flex items-center gap-1 border-r pr-4">
                        {COLORS.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                aria-label={`Use ${color.name} pen`}
                                title={color.name}
                                onClick={() => setCurrentColor(color.value)}
                                className={cn(
                                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                                    currentColor === color.value
                                        ? "scale-110 border-slate-800 ring-2 ring-slate-400 ring-offset-1"
                                        : "border-transparent"
                                )}
                                style={{ backgroundColor: color.value }}
                            />
                        ))}
                    </div>
                    <label className="flex items-center gap-2 border-r pr-4 text-xs font-medium text-slate-500">
                        Width
                        <input
                            type="range"
                            min="1"
                            max="15"
                            value={currentWidth}
                            onChange={(event) => setCurrentWidth(Number(event.target.value))}
                            className="w-24"
                        />
                    </label>
                    <Button variant="ghost" size="sm" onClick={undo}>
                        <Undo className="mr-2 h-4 w-4" /> Undo
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setPaths((existingPaths) => existingPaths.filter((path) => path.imageIndex !== imageIndex))}
                    >
                        <Eraser className="mr-2 h-4 w-4" /> Clear image
                    </Button>
                </div>

                <div className="flex min-h-[500px] flex-col items-center overflow-auto rounded-md border bg-slate-100 p-4 shadow-inner">
                    <div ref={containerRef} className="relative inline-block max-w-full">
                        <img
                            ref={imageRef}
                            src={annotatedImages[imageIndex] || submission.images[imageIndex]}
                            alt={`Submitted answer sheet ${imageIndex + 1}`}
                            className="pointer-events-none h-auto max-w-full select-none shadow-lg"
                            crossOrigin="anonymous"
                            onLoad={resizeCanvas}
                        />
                        <canvas
                            ref={canvasRef}
                            className="touch-none absolute left-0 top-0 z-20 cursor-crosshair"
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

            <aside>
                <div className="sticky top-6 space-y-4 rounded-md border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold">Grading & Feedback</h2>
                    <label className="block space-y-1 text-sm font-medium">
                        Marks awarded
                        <Input
                            type="number"
                            value={marks}
                            onChange={(event) => setMarks(event.target.value)}
                            placeholder="Enter marks"
                        />
                    </label>
                    <label className="block space-y-1 text-sm font-medium">
                        Feedback
                        <Textarea
                            value={feedback}
                            onChange={(event) => setFeedback(event.target.value)}
                            placeholder="Enter detailed feedback..."
                            className="min-h-[180px]"
                        />
                    </label>
                    <p className="rounded border bg-muted/50 p-3 text-xs text-muted-foreground">
                        Draw directly on any image. Saving permanently merges new marks into checked copies while preserving the originals.
                    </p>
                    <Button className="w-full" onClick={save} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save grading & annotations
                    </Button>
                </div>
            </aside>
        </div>
    );
};

export default TestImageGradingInterface;
