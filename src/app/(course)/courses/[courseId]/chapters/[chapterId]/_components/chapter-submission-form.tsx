"use client"
import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Loader2, X, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChapterSubmissionFormProps {
  courseId: string;
  chapterId: string;
}

export const ChapterSubmissionForm = ({
  courseId,
  chapterId,
}: ChapterSubmissionFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { startUpload } = useUploadThing("chapterSubmission");
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    const urls = fileArray.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleClear = () => {
    if (isUploading) return;
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      const uploadRes = await startUpload(selectedFiles);

      if (!uploadRes || uploadRes.length === 0) {
        throw new Error("Upload failed. Please try again.");
      }

      const urls = uploadRes.map((r) => r.url);
      
      await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/submissions`, {
        images: urls,
      });

      toast.success("Submission uploaded successfully");
      handleClear();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Submit Your Assignment
      </div>
      
      {previewUrls.length === 0 ? (
        <>
          <p className="text-sm text-slate-500 mt-2 mb-4">
            You can upload multiple images or use your camera directly.
          </p>
          <div className="flex flex-col gap-2 relative">
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer transition">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <ImageIcon className="h-5 w-5 text-sky-600" />
                    <span>Select Images or Open Camera</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
            </label>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-slate-500 mb-4">
            Previewing {previewUrls.length} file{previewUrls.length > 1 ? "s" : ""}. Ready to submit?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative aspect-square border-2 border-slate-200 rounded-md overflow-hidden bg-white shadow-sm flex items-center justify-center">
                <img 
                  src={url} 
                  alt={`Preview ${i + 1}`} 
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-x-2">
            <Button onClick={handleSubmit} disabled={isUploading} className="flex-1 md:flex-none">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={handleClear} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
