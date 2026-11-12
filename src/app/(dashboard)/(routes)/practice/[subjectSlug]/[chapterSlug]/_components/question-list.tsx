"use client";

import axios from "axios";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Filter, Lightbulb, RotateCcw, RotateCw, Search } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathText } from "@/components/math-text";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PracticeQuestion } from "@/lib/practice-catalog";

export const QuestionList = ({ questions, compact = false }: { questions: PracticeQuestion[]; compact?: boolean }) => {
  const [school, setSchool] = useState("all");
  const [year, setYear] = useState("all");
  const [query, setQuery] = useState("");
  const [openAnswers, setOpenAnswers] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, PracticeQuestion["attemptStatus"]>>(() => Object.fromEntries(questions.map((question) => [question.id, question.attemptStatus])));
  const [savingId, setSavingId] = useState<string | null>(null);

  const schools = Array.from(new Set(questions.map((question) => question.school)));
  const years = Array.from(new Set(questions.map((question) => question.year))).sort((a, b) => b - a);
  const filtered = useMemo(() => questions.filter((question) => {
    const matchesSchool = school === "all" || question.school === school;
    const matchesYear = year === "all" || question.year === Number(year);
    const searchable = `${question.question} ${question.school} ${question.exam}`.toLowerCase();
    return matchesSchool && matchesYear && searchable.includes(query.toLowerCase());
  }), [questions, query, school, year]);

  const toggleAnswer = (id: string) => setOpenAnswers((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const reset = () => { setSchool("all"); setYear("all"); setQuery(""); };
  const filterCount = Number(school !== "all") + Number(year !== "all");
  const saveOutcome = async (questionId: string, status: NonNullable<PracticeQuestion["attemptStatus"]>) => {
    const previous = statuses[questionId];
    setStatuses((current) => ({ ...current, [questionId]: status }));
    setSavingId(questionId);
    try {
      await axios.post(`/api/practice/questions/${questionId}/attempt`, { status });
      toast.success(status === "SOLVED" ? "Marked as solved" : "Added to revision");
    } catch {
      setStatuses((current) => ({ ...current, [questionId]: previous }));
      toast.error("Could not save your progress");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section id="questions" data-compact={compact || undefined} className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" className="h-9 pl-9 text-xs" /></div>
        <Sheet><SheetTrigger asChild><Button variant="outline" size="sm" className="h-9 shrink-0 px-3"><Filter className="mr-1.5 h-3.5 w-3.5" />Filter{filterCount > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{filterCount}</span>}</Button></SheetTrigger><SheetContent side="bottom" className="rounded-t-2xl"><SheetHeader className="text-left"><SheetTitle>Filter questions</SheetTitle></SheetHeader><div className="mt-5 grid gap-4"><label className="grid gap-1.5 text-xs font-medium">School<Select value={school} onValueChange={setSchool}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All schools</SelectItem>{schools.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label><label className="grid gap-1.5 text-xs font-medium">Year<Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{years.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}</SelectContent></Select></label></div><SheetFooter className="mt-6 flex-row gap-2"><Button variant="outline" className="flex-1" onClick={reset}>Reset</Button><SheetClose asChild><Button className="flex-1">Show {filtered.length}</Button></SheetClose></SheetFooter></SheetContent></Sheet>
      </div>
      <div className="mb-4 hidden flex-col gap-3 md:flex lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-lg font-bold">Previous-year questions</h2><p className="mt-1 text-sm text-muted-foreground">Browse by source, then reveal the answer when you are ready.</p></div>
        <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_170px_110px_auto] lg:w-[720px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search within this chapter" className="h-9 text-xs" />
          <Select value={school} onValueChange={setSchool}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="School" /></SelectTrigger><SelectContent><SelectItem value="all">All schools</SelectItem>{schools.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={year} onValueChange={setYear}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{years.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}</SelectContent></Select>
          <Button variant="ghost" size="sm" className="h-9" onClick={reset}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset</Button>
        </div>
      </div>

      <div className="mb-2 text-[11px] text-muted-foreground md:mb-3 md:text-xs">Showing <strong className="text-foreground">{filtered.length}</strong> questions</div>
      <div className="space-y-2.5 md:space-y-3">
        {filtered.map((question, index) => {
          const isOpen = openAnswers.includes(question.id);
          const status = statuses[question.id];
          return (
            <article key={question.id} className="overflow-hidden rounded-lg border bg-card">
              <div className="border-b bg-muted/25 px-3 py-2 sm:px-5 sm:py-2.5">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground sm:flex-wrap sm:gap-y-1.5 sm:text-[11px]"><strong className="text-foreground">Q{index + 1}</strong><span className="hidden sm:inline">{question.year} · {question.school} · {question.exam}</span>{status && <Badge className={status === "SOLVED" ? "ml-auto h-5 bg-emerald-600 px-1.5 text-[9px] hover:bg-emerald-600 sm:text-[10px]" : "ml-auto h-5 bg-amber-500 px-1.5 text-[9px] text-black hover:bg-amber-500 sm:text-[10px]"}>{status === "SOLVED" ? "Solved" : "Revise"}</Badge>}<Badge variant="outline" className={status ? "h-5 px-1.5 text-[9px] sm:text-[10px]" : "ml-auto h-5 px-1.5 text-[9px] sm:text-[10px]"}>{question.marks} {question.marks === 1 ? "mark" : "marks"}</Badge><Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-normal sm:text-[10px]">{question.type}</Badge></div>
              </div>
              <div className="p-3.5 sm:p-5">
                <MathText value={question.question} className="max-w-full whitespace-pre-wrap break-words text-sm font-medium leading-6 sm:text-[15px] sm:leading-7" />
                {question.formula && <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md border bg-muted/35 px-3 py-2 text-sm"><span className="text-[10px] font-sans font-semibold uppercase tracking-wide text-muted-foreground">Formula</span><MathText value={question.formula} forceMath className="max-w-full overflow-x-auto" /></div>}
                <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5"><Button variant={isOpen ? "secondary" : "outline"} size="sm" onClick={() => toggleAnswer(question.id)}>{isOpen ? <ChevronUp className="mr-1.5 h-3.5 w-3.5" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}{isOpen ? "Hide answer" : "Show answer"}</Button></div>
              </div>
              {isOpen && <div className="border-t bg-emerald-50/60 px-4 py-4 dark:bg-emerald-950/20 sm:px-5"><div className="flex gap-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Answer</p><MathText value={question.answer} className="mt-1 max-w-full whitespace-pre-wrap break-words text-sm font-semibold" /><MathText value={question.solution} className="mt-2 max-w-full whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground" /><div className="mt-4 border-t border-emerald-200/70 pt-3 dark:border-emerald-900"><p className="mb-2 text-xs font-medium text-muted-foreground">How did you do?</p><div className="flex flex-wrap gap-2"><Button size="sm" variant={status === "SOLVED" ? "default" : "outline"} disabled={savingId === question.id} onClick={() => saveOutcome(question.id, "SOLVED")}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Solved</Button><Button size="sm" variant={status === "NEEDS_REVIEW" ? "secondary" : "outline"} disabled={savingId === question.id} onClick={() => saveOutcome(question.id, "NEEDS_REVIEW")}><RotateCw className="mr-1.5 h-3.5 w-3.5" />Needs revision</Button></div></div></div></div></div>}
            </article>
          );
        })}
      </div>
      {!filtered.length && <div className="rounded-lg border border-dashed px-4 py-10 text-center"><p className="text-sm font-semibold">No questions match these filters</p><Button variant="link" size="sm" onClick={reset}>Clear filters</Button></div>}
    </section>
  );
};
