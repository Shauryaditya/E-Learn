"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Camera, FileText, Image as ImageIcon, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";

interface TestSubmissionFormProps {
    testSeriesId: string;
    testChapterId: string;
}

const MAX_IMAGES = 15;
const MAX_FILE_SIZE = 16 * 1024 * 1024;

export const TestSubmissionForm = ({
    testSeriesId,
    testChapterId,
}: TestSubmissionFormProps) => {
    const router = useRouter();
    const { startUpload } = useUploadThing("testSubmission");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const previewUrlsRef = useRef<string[]>([]);

    const clearSelection = () => {
        if (isUploading) return;
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = [];
        setPreviewUrls([]);
        setSelectedFiles([]);
    };

    useEffect(() => {
        return () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const handleFileSelect = (files: FileList | null, appendImages = false) => {
        if (!files?.length) return;

        const chosenFiles = Array.from(files);
        const pdfFiles = chosenFiles.filter((file) => file.type === "application/pdf");
        const imageFiles = chosenFiles.filter((file) => file.type.startsWith("image/"));

        if (chosenFiles.some((file) => file.size > MAX_FILE_SIZE)) {
            toast.error("Each file must be 16MB or smaller");
            return;
        }

        if (pdfFiles.length > 0 && imageFiles.length > 0) {
            toast.error("Choose either one PDF or multiple images");
            return;
        }

        if (appendImages && pdfFiles.length > 0) {
            toast.error("A PDF cannot be added to an image submission");
            return;
        }

        const totalImageCount = appendImages
            ? selectedFiles.length + imageFiles.length
            : imageFiles.length;

        if (pdfFiles.length > 1 || totalImageCount > MAX_IMAGES) {
            toast.error(`Upload one PDF or up to ${MAX_IMAGES} images`);
            return;
        }

        if (pdfFiles.length + imageFiles.length !== chosenFiles.length) {
            toast.error("Only PDF and image files are supported");
            return;
        }

        const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));

        if (appendImages) {
            setSelectedFiles((currentFiles) => [...currentFiles, ...imageFiles]);
            setPreviewUrls((currentUrls) => {
                const nextUrls = [...currentUrls, ...newPreviewUrls];
                previewUrlsRef.current = nextUrls;
                return nextUrls;
            });
            return;
        }

        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = newPreviewUrls;
        setSelectedFiles(chosenFiles);
        setPreviewUrls(newPreviewUrls);
    };

    const removeImage = (indexToRemove: number) => {
        if (isUploading) return;

        URL.revokeObjectURL(previewUrls[indexToRemove]);
        setSelectedFiles((files) => files.filter((_, index) => index !== indexToRemove));
        setPreviewUrls((urls) => {
            const nextUrls = urls.filter((_, index) => index !== indexToRemove);
            previewUrlsRef.current = nextUrls;
            return nextUrls;
        });
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);
        handleFileSelect(event.dataTransfer.files);
    };

    const handleSubmit = async () => {
        if (selectedFiles.length === 0) return;

        try {
            setIsUploading(true);
            const uploadedFiles = await startUpload(selectedFiles);

            if (!uploadedFiles || uploadedFiles.length !== selectedFiles.length) {
                throw new Error("Not all files were uploaded");
            }

            const submittingPdf = selectedFiles[0].type === "application/pdf";
            await axios.post(
                `/api/testseries/${testSeriesId}/testChapter/${testChapterId}/submission`,
                {
                    pdfUrl: submittingPdf ? uploadedFiles[0].url : null,
                    images: submittingPdf ? [] : uploadedFiles.map((file) => file.url),
                    fileName: submittingPdf ? selectedFiles[0].name : `${selectedFiles.length} answer-sheet images`,
                    fileSize: selectedFiles.reduce((total, file) => total + file.size, 0),
                }
            );

            toast.success("Test submitted successfully");
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            previewUrlsRef.current = [];
            setPreviewUrls([]);
            setSelectedFiles([]);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while submitting the test");
        } finally {
            setIsUploading(false);
        }
    };

    const isPdf = selectedFiles[0]?.type === "application/pdf";

    return (
        <div className="space-y-4">
            <div>
                <p className="font-medium">Test Submission</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Upload one PDF or up to {MAX_IMAGES} answer-sheet images.
                </p>
            </div>

            {selectedFiles.length === 0 ? (
                <label
                    onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                        isDragging
                            ? "border-blue-400 bg-blue-500/10"
                            : "border-border bg-muted/40 hover:border-primary/40"
                    }`}
                >
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                        <p className="text-sm font-semibold">Click or drag and drop your answer sheet</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            PDF, JPG, PNG, WEBP and other images · 16MB per file
                        </p>
                    </div>
                    <input
                        type="file"
                        accept="application/pdf,image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            handleFileSelect(event.target.files);
                            event.target.value = "";
                        }}
                    />
                </label>
            ) : isPdf ? (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
                    <FileText className="h-9 w-9 text-sky-500" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{selectedFiles[0].name}</p>
                        <p className="text-xs text-muted-foreground">PDF ready to upload</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {previewUrls.map((url, index) => (
                            <div key={url} className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                                <img
                                    src={url}
                                    alt={`Answer sheet ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                                    {index + 1}
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Remove answer sheet ${index + 1}`}
                                    disabled={isUploading}
                                    onClick={() => removeImage(index)}
                                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-rose-600 disabled:opacity-50"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {selectedFiles.length} image{selectedFiles.length === 1 ? "" : "s"} selected
                    </p>
                    {selectedFiles.length < MAX_IMAGES && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted">
                                <Camera className="h-4 w-4" />
                                Take another photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    disabled={isUploading}
                                    className="hidden"
                                    onChange={(event) => {
                                        handleFileSelect(event.target.files, true);
                                        event.target.value = "";
                                    }}
                                />
                            </label>
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted">
                                <ImagePlus className="h-4 w-4" />
                                Add from gallery
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    disabled={isUploading}
                                    className="hidden"
                                    onChange={(event) => {
                                        handleFileSelect(event.target.files, true);
                                        event.target.value = "";
                                    }}
                                />
                            </label>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-end gap-2">
                {selectedFiles.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={isUploading}>
                        <X className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                )}
                <Button type="button" onClick={handleSubmit} disabled={selectedFiles.length === 0 || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isUploading ? "Uploading..." : "Submit Test"}
                </Button>
            </div>
        </div>
    );
};
