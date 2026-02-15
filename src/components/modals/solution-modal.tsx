"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, Lightbulb, Copy, FileText } from "lucide-react";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SolutionModalProps {
  fileUrl: string;
}

export const SolutionModal = ({
    fileUrl
}: SolutionModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState("");

  const onGenerate = async () => {
    try {
        // Check if file is PDF
      if (!fileUrl.toLowerCase().endsWith('.pdf')) {
          toast.error("AI Solutions only available for PDF files");
          return;
      }
        
      setLoading(true);
      
      const response = await axios.post("/api/gemini/solution", {
        fileUrl
      });

      if (response.data.solution) {
          setSolution(response.data.solution);
          toast.success("Solution generated!");
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate solution");
    } finally {
      setLoading(false);
    }
  };

  const onCopy = () => {
    navigator.clipboard.writeText(solution);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700">
          <Lightbulb className="w-4 h-4 mr-2" />
          AI Solution
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>AI Solution Generator</DialogTitle>
          <DialogDescription>
            Generate a detailed solution or answer key for this document.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
             {!solution && !loading && (
                 <div className="flex flex-col items-center justify-center space-y-4 py-8">
                     <FileText className="w-12 h-12 text-slate-300" />
                     <p className="text-sm text-muted-foreground text-center max-w-sm">
                         Click generate to have AI analyze this PDF and create a step-by-step solution guide.
                     </p>
                     <Button onClick={onGenerate}>
                        Generate Solution
                     </Button>
                 </div>
             )}

            {loading && (
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <p className="text-sm text-muted-foreground">Analyzing document (this may take a moment)...</p>
                </div>
            )}

            {!loading && solution && (
                <div className="space-y-4">
                    <ScrollArea className="h-[50vh] border rounded-md p-6 bg-slate-50">
                        <div className="prose text-black prose-sm max-w-none whitespace-pre-wrap font-mono text-sm">
                            {solution}
                        </div>
                    </ScrollArea>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onCopy}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                        <Button variant="ghost" onClick={() => setSolution("")}>
                            Clear
                        </Button>
                    </div>
                </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
};
