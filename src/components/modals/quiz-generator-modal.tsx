"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, Wand2, Check, Copy, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface QuizGeneratorModalProps {
  chapterId: string;
  courseId: string;
}


const QuestionCard = ({ question, index }: { question: any, index: number }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const onSelect = (option: string) => {
      if (selectedOption) return; // Prevent changing after selection? Or allow? Let's lock it for "evaluation" feel.
      setSelectedOption(option);
      setShowAnswer(true); // Auto-show answer/explanation after selection
  }

  return (
    <Card className="mb-4 bg-background border-border">
      <CardContent className="p-4">
        <p className="font-semibold mb-2 text-foreground">{index + 1}. {question.question}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
          {question.options.map((opt: string, j: number) => {
             const isCorrect = opt === question.answer;
             const isSelected = selectedOption === opt;
             
             let optionClass = "bg-secondary/50 border-border hover:bg-secondary"; // Default

             if (selectedOption) {
                 if (isCorrect) {
                     optionClass = "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600";
                 } else if (isSelected) {
                     optionClass = "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600";
                 } else {
                     optionClass = "opacity-50"; // Dim others
                 }
             }

             return (
              <div 
                key={j} 
                onClick={() => onSelect(opt)}
                className={`p-3 rounded-md border cursor-pointer transition-all ${optionClass}`}
              >
                {opt}
              </div>
             )
          })}
        </div>
        
        {showAnswer && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
               <p className={selectedOption === question.answer ? "text-green-600 font-medium mb-1" : "text-red-500 font-medium mb-1"}>
                   {selectedOption === question.answer ? "Correct!" : `Incorrect. The answer is ${question.answer}`}
               </p>
               <p className="text-xs text-muted-foreground italic bg-muted p-2 rounded">
                  {question.explanation}
               </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export const QuizGeneratorModal = ({
    chapterId,
    courseId
}: QuizGeneratorModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("Medium");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  const onGenerate = async () => {
    try {
      setLoading(true);
      setGeneratedQuestions([]);

      const response = await axios.post("/api/gemini/quiz", {
        chapterId,
        courseId,
        difficulty
      });

      if (response.data.questions) {
          setGeneratedQuestions(response.data.questions);
          toast.success("Questions generated successfully!");
      }

    } catch (error: any) {
      console.error(error);
      if (error.response?.data) {
          toast.error(error.response.data);
      } else {
          toast.error("Failed to generate questions");
      }
    } finally {
      setLoading(false);
    }
  };

  const onFormattedCopy = () => {
      if (generatedQuestions.length === 0) return;
      
      const text = generatedQuestions.map((q, i) => {
          return `Q${i+1}. ${q.question}\nOptions:\n${q.options.map((o: string) => `- ${o}`).join("\n")}\nAnswer: ${q.answer}\nExplanation: ${q.explanation}\n`
      }).join("\n\n");
      
      navigator.clipboard.writeText(text);
      toast.success("Quiz copied to clipboard!");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-sky-500 text-sky-600 hover:bg-sky-50">
          <Wand2 className="w-4 h-4 mr-2" />
          Generate Quiz from Chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>AI Quiz Generator</DialogTitle>
          <DialogDescription>
            Generate multiple-choice questions based on this chapter&apos;s content (Description & Attachments).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="difficulty" className="text-right">
                Difficulty
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        {loading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <p className="text-sm text-slate-500">Reading chapter content and generating questions...</p>
            </div>
        )}

        {!loading && generatedQuestions.length > 0 && (
            <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="space-y-4">
                    {generatedQuestions.map((q, i) => (
                        <QuestionCard key={i} question={q} index={i} />
                    ))}
                </div>
            </ScrollArea>
        )}

        <div className="flex justify-end gap-2 mt-4">
             {generatedQuestions.length === 0 ? (
                 <Button onClick={onGenerate} disabled={loading}>
                    Generate
                 </Button>
             ) : (
                <>
                    <Button variant="outline" onClick={() => setGeneratedQuestions([])}>
                        Discard
                    </Button>
                    <Button onClick={onFormattedCopy}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                    </Button>
                </>
             )}
        </div>

      </DialogContent>
    </Dialog>
  );
};
