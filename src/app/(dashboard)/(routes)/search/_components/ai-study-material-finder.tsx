"use client";

import axios from "axios";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, BookOpen, BrainCircuit, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";

const GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const BOARDS = ["CBSE", "ICSE", "ISC", "State Board", "IB", "IGCSE"];
const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
  "Computer Science", "History", "Geography", "Accountancy", "Economics", "Business Studies",
];

type Profile = {
  grade: string | null;
  board: string | null;
  subjects: string[];
} | null;

type Suggestion = {
  id: string;
  title: string;
  reason: string;
  materialType: "NOTES" | "ASSIGNMENTS" | "BOTH";
  category: string;
  chaptersLength: number;
  imageUrl: string | null;
  price: number | null;
};

const materialLabels = {
  NOTES: "Notes",
  ASSIGNMENTS: "Assignments",
  BOTH: "Notes + assignments",
};

export const AiStudyMaterialFinder = ({ profile }: { profile: Profile }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState(profile?.grade || "");
  const [board, setBoard] = useState(profile?.board || "");
  const [subject, setSubject] = useState(profile?.subjects[0] || "");
  const [topic, setTopic] = useState("");
  const [materialType, setMaterialType] = useState<"NOTES" | "ASSIGNMENTS" | "BOTH">("BOTH");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<{ summary: string; suggestions: Suggestion[] } | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!grade || !board || !subject || topic.trim().length < 2) {
      toast.error("Add your class, board, subject, and topic.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/gemini/study-materials", {
        grade, board, subject, topic, materialType, goal,
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Could not find recommendations right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 dark:border-violet-900/70 dark:from-violet-950/40 dark:via-background dark:to-sky-950/30 sm:p-6">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">AI Study Material Finder</h2>
                <Badge className="bg-violet-600 text-white hover:bg-violet-600">AI</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Tell us your class, board, subject, and topic. We&apos;ll find the most relevant notes and assignments already available here.
              </p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-violet-600 text-white hover:bg-violet-700 sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" /> Find material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-xl p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-600" /> What do you want to study?</DialogTitle>
                <DialogDescription>Gemini will match your request only with published material from Aaccent.</DialogDescription>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Class</Label><Select value={grade} onValueChange={setGrade}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{GRADES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Board</Label><Select value={board} onValueChange={setBoard}><SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger><SelectContent>{BOARDS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Subject</Label><Select value={subject} onValueChange={setSubject}><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent>{SUBJECTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Material type</Label><Select value={materialType} onValueChange={(value) => setMaterialType(value as typeof materialType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BOTH">Notes + assignments</SelectItem><SelectItem value="NOTES">Notes</SelectItem><SelectItem value="ASSIGNMENTS">Assignments</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="study-topic">Topic or chapter</Label><Input id="study-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Quadratic equations, Light, The French Revolution" maxLength={160} /></div>
                <div className="space-y-2"><Label htmlFor="study-goal">What do you need help with? <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="study-goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Revise concepts for my unit test and practise difficult questions" maxLength={300} className="min-h-[72px]" /></div>
                <Button type="submit" disabled={loading} className="w-full bg-violet-600 text-white hover:bg-violet-700 sm:w-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {loading ? "Finding the best matches..." : "Get AI suggestions"}
                </Button>
              </form>

              {result && !loading && (
                <section className="space-y-3 border-t pt-4" aria-live="polite">
                  <div><h3 className="font-semibold">Recommended for you</h3><p className="mt-1 text-sm text-muted-foreground">{result.summary}</p></div>
                  {result.suggestions.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {result.suggestions.map((item) => (
                        <Link key={item.id} href={`/courses/${item.id}`} onClick={() => setOpen(false)} className="group rounded-lg border bg-card p-4 transition hover:border-violet-300 hover:shadow-sm dark:hover:border-violet-800">
                          <div className="flex items-start justify-between gap-3"><Badge variant="secondary">{materialLabels[item.materialType]}</Badge><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-violet-600" /></div>
                          <h4 className="mt-3 font-semibold leading-snug">{item.title}</h4>
                          <p className="mt-1 text-xs text-muted-foreground">{item.category} · {item.chaptersLength} learning {item.chaptersLength === 1 ? "unit" : "units"}</p>
                          <p className="mt-3 text-sm text-muted-foreground">{item.reason}</p>
                          <div className="mt-3 flex items-center justify-between text-sm"><span className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-300"><BookOpen className="h-4 w-4" /> Open material</span><span className="font-medium">{item.price ? formatPrice(item.price) : "Free"}</span></div>
                        </Link>
                      ))}
                    </div>
                  ) : <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No close match is published yet. Try a broader topic or choose Notes + assignments.</div>}
                </section>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};
