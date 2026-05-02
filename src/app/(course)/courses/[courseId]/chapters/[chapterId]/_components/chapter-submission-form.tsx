"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChapterSubmissionFormProps {
  courseId: string;
  chapterId: string;
  dueDate?: string;
  points?: number;
}

export const ChapterSubmissionForm = ({
  courseId,
  chapterId,
  dueDate,
  points,
}: ChapterSubmissionFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { startUpload } = useUploadThing("chapterSubmission");
  const router = useRouter();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    const urls = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClear = () => {
    if (isUploading) return;
    setSelectedFiles([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    try {
      setIsUploading(true);
      const uploadRes = await startUpload(selectedFiles);
      if (!uploadRes || uploadRes.length === 0) throw new Error("Upload failed.");
      const urls = uploadRes.map((r) => r.url);
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/submissions`,
        { images: urls }
      );
      toast.success("Submission uploaded successfully");
      handleClear();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a2236] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#243050] p-2 rounded-xl">
          <FileText className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Assignment Submission</p>
          <p className="text-slate-400 text-xs">
            {dueDate ? `Due: ${dueDate} • ` : ""}
            {points ? `${points} Points` : ""}
          </p>
        </div>
      </div>

      {/* Drop zone or previews */}
      {previewUrls.length === 0 ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 w-full p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-500/10"
              : "border-white/10 bg-[#151d2e] hover:border-white/20"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-slate-400" />
          <div className="text-center">
            <p className="text-white font-semibold text-sm">
              Click or drag and drop your solution
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Supported formats: PDF, DOCX, ZIP (Max 50MB)
            </p>
          </div>
          <input
            type="file"
            accept="image/*,application/pdf,.docx,.zip"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {previewUrls.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden bg-[#151d2e] border border-white/10"
              >
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center">
            {previewUrls.length} file{previewUrls.length > 1 ? "s" : ""} selected
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 leading-tight max-w-[150px]">
          Multiple files can be uploaded as a single .zip
        </p>

        <div className="flex items-center gap-2">
          {previewUrls.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isUploading || selectedFiles.length === 0}
            className="bg-indigo-100 hover:bg-white text-indigo-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Submit Assignment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};