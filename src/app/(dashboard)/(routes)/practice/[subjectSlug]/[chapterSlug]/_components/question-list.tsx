"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathText } from "@/components/math-text";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PracticeQuestion } from "@/lib/practice-catalog";

export const QuestionList = ({ questions }: { questions: PracticeQuestion[] }) => {
  const [school, setSchool] = useState("all");
  const [year, setYear] = useState("all");
  const [query, setQuery] = useState("");
  const [openAnswers, setOpenAnswers] = useState<string[]>([]);

  const schools = Array.from(new Set(questions.map((question) => question.school)));
  const years = Array.from(new Set(questions.map((question) => question.year))).sort((a, b) => b - a);
  const filtered = useMemo(() => questions.filter((question) => {
    const matchesSchool = school === "all" || question.school === school;
    const matchesYear = year === "all" || question.year === Number(year);
    const searchable = `${question.question} ${question.school} ${question.exam}`.toLowerCase();
    return matchesSchool && matchesYear && searchable.includes(query.toLowerCase());
  }), [questions, query, school, year]);

  const toggleAnswer = (id: string) => setOpenAnswers((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <section id="questions" className="scroll-mt-20">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-lg font-bold">Previous-year questions</h2><p className="mt-1 text-sm text-muted-foreground">Browse by source, then reveal the answer when you are ready.</p></div>
        <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_170px_110px_auto] lg:w-[720px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search within this chapter" className="h-9 text-xs" />
          <Select value={school} onValueChange={setSchool}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="School" /></SelectTrigger><SelectContent><SelectItem value="all">All schools</SelectItem>{schools.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={year} onValueChange={setYear}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{years.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}</SelectContent></Select>
          <Button variant="ghost" size="sm" className="h-9" onClick={() => { setSchool("all"); setYear("all"); setQuery(""); }}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset</Button>
        </div>
      </div>

      <div className="mb-3 text-xs text-muted-foreground">Showing <strong className="text-foreground">{filtered.length}</strong> questions</div>
      <div className="space-y-3">
        {filtered.map((question, index) => {
          const isOpen = openAnswers.includes(question.id);
          return (
            <article key={question.id} className="overflow-hidden rounded-lg border bg-card">
              <div className="border-b bg-muted/25 px-4 py-2.5 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground"><strong className="mr-1 text-foreground">Q{index + 1}</strong><span>{question.year}</span><span>·</span><span>{question.school}</span><span>·</span><span>{question.exam}</span><Badge variant="outline" className="ml-auto h-5 text-[10px]">{question.marks} {question.marks === 1 ? "mark" : "marks"}</Badge><Badge variant="secondary" className="h-5 text-[10px] font-normal">{question.type}</Badge></div>
              </div>
              <div className="p-4 sm:p-5">
                <MathText value={question.question} className="max-w-full whitespace-pre-wrap break-words text-[15px] font-medium leading-7" />
                {question.formula && <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md border bg-muted/35 px-3 py-2 text-sm"><span className="text-[10px] font-sans font-semibold uppercase tracking-wide text-muted-foreground">Formula</span><MathText value={question.formula} forceMath className="max-w-full overflow-x-auto" /></div>}
                <div className="mt-5 flex flex-wrap items-center gap-2"><Button variant={isOpen ? "secondary" : "outline"} size="sm" onClick={() => toggleAnswer(question.id)}>{isOpen ? <ChevronUp className="mr-1.5 h-3.5 w-3.5" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}{isOpen ? "Hide answer" : "Show answer"}</Button></div>
              </div>
              {isOpen && <div className="border-t bg-emerald-50/60 px-4 py-4 dark:bg-emerald-950/20 sm:px-5"><div className="flex gap-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Answer</p><MathText value={question.answer} className="mt-1 max-w-full whitespace-pre-wrap break-words text-sm font-semibold" /><MathText value={question.solution} className="mt-2 max-w-full whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground" /></div></div></div>}
            </article>
          );
        })}
      </div>
    </section>
  );
};
