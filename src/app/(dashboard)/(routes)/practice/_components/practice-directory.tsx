"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Building2, FileQuestion, Files, Filter, RotateCcw, Search } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PracticeCollection } from "@/lib/practice-catalog";

const unique = (values: string[]) => Array.from(new Set(values)).sort();
const questionHref = (values: Record<string, string>) => `/practice/questions?${new URLSearchParams(values).toString()}`;
type Profile = { board: string | null; grade: string | null; subjects: string[]; targetExam: string | null } | null;

const inferGoal = (targetExam: string | null | undefined, goals: string[]) => {
  const target = (targetExam || "").toLowerCase();
  if (target.includes("advanced")) return goals.find((goal) => goal === "JEE Advanced") || "all";
  if (target.includes("jee")) return goals.find((goal) => goal === "JEE Main") || "all";
  if (target.includes("neet")) return goals.find((goal) => goal === "NEET") || "all";
  return goals.find((goal) => goal === "School & boards") || "all";
};

export const PracticeDirectory = ({ collections, profile }: { collections: PracticeCollection[]; profile: Profile }) => {
  const goals = unique(collections.map((item) => item.goal));
  const boards = unique(collections.map((item) => item.board));
  const grades = unique(collections.map((item) => item.grade));
  const subjects = unique(collections.map((item) => item.subject));
  const initialGoal = inferGoal(profile?.targetExam, goals);
  const initialBoard = initialGoal === "School & boards" && profile?.board && boards.includes(profile.board) ? profile.board : "all";
  const initialGrade = initialGoal === "School & boards" && profile?.grade && grades.includes(profile.grade) ? profile.grade : "all";
  const initialSubject = profile?.subjects.find((candidate) => collections.some((item) => item.subject === candidate && (initialGoal === "all" || item.goal === initialGoal) && (initialBoard === "all" || item.board === initialBoard) && (initialGrade === "all" || item.grade === initialGrade))) || "all";
  const [goal, setGoal] = useState(initialGoal);
  const [board, setBoard] = useState(initialBoard);
  const [grade, setGrade] = useState(initialGrade);
  const [subject, setSubject] = useState(initialSubject);
  const [school, setSchool] = useState("all");
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"chapters" | "papers">("chapters");

  const filtered = useMemo(() => collections.filter((item) =>
    (goal === "all" || item.goal === goal) && (board === "all" || item.board === board) && (grade === "all" || item.grade === grade) &&
    (subject === "all" || item.subject === subject) && (school === "all" || item.school === school) &&
    `${item.goal} ${item.board} ${item.grade} ${item.subject} ${item.school}`.toLowerCase().includes(query.toLowerCase())
  ), [board, collections, goal, grade, query, school, subject]);

  const chapters = useMemo(() => {
    const grouped = new Map<string, { slug: string; title: string; goal: string; board: string; grade: string; subject: string; questionCount: number; solved: number; review: number }>();
    for (const collection of filtered) for (const chapter of collection.chapters) {
      const key = `${collection.goal}|${collection.board}|${collection.grade}|${collection.subject}|${chapter.slug}`;
      const current = grouped.get(key) || { slug: chapter.slug, title: chapter.title, goal: collection.goal, board: collection.board, grade: collection.grade, subject: collection.subject, questionCount: 0, solved: 0, review: 0 };
      current.questionCount += chapter.questionCount;
      for (const question of collection.questions) if (question.chapterSlug === chapter.slug) {
        if (question.attemptStatus === "SOLVED") current.solved += 1;
        if (question.attemptStatus === "NEEDS_REVIEW") current.review += 1;
      }
      grouped.set(key, current);
    }
    return Array.from(grouped.values()).sort((a, b) => b.review - a.review || b.questionCount - a.questionCount || a.title.localeCompare(b.title));
  }, [filtered]);

  const papers = useMemo(() => filtered.flatMap((collection) => collection.papers.map((paper) => ({ ...paper, collection }))), [filtered]);
  const reset = () => { setGoal("all"); setBoard("all"); setGrade("all"); setSubject("all"); setSchool("all"); setQuery(""); };
  const selectGoal = (value: string) => { setGoal(value); setBoard("all"); setGrade("all"); setSchool("all"); };
  const activeFilters = [goal, board, grade, subject, school].filter((value) => value !== "all").length;
  const reviewCount = chapters.reduce((sum, chapter) => sum + chapter.review, 0);
  const context = [goal !== "all" ? goal : null, grade !== "all" && grade !== "Entrance exam" ? grade : null, board !== "all" && board !== goal ? board : null].filter(Boolean).join(" · ") || "All exam goals";

  return <>
    <section className="md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Showing content for</p><p className="truncate text-sm font-semibold">{context}</p></div>
        <Sheet><SheetTrigger asChild><Button variant="outline" size="sm" className="h-9 shrink-0"><Filter className="mr-1.5 h-3.5 w-3.5" />Filters{activeFilters > 0 && <Badge className="ml-1.5 h-5 min-w-5 justify-center rounded-full px-1.5">{activeFilters}</Badge>}</Button></SheetTrigger><SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-7"><SheetHeader className="text-left"><SheetTitle>Filter practice</SheetTitle><SheetDescription>Choose your exam goal, syllabus and sources.</SheetDescription></SheetHeader><div className="mt-5 grid gap-4"><FilterSelect label="Exam goal" value={goal} onChange={selectGoal} allLabel="All exam goals" values={goals} /><FilterSelect label="Board" value={board} onChange={setBoard} allLabel="All boards" values={boards} /><FilterSelect label="Class" value={grade} onChange={setGrade} allLabel="All classes" values={grades} /><FilterSelect label="Subject" value={subject} onChange={setSubject} allLabel="All subjects" values={subjects} /><FilterSelect label="School" value={school} onChange={setSchool} allLabel="All sources" values={unique(collections.map((item) => item.school))} /></div><SheetFooter className="mt-6 flex-row gap-2"><Button variant="outline" className="flex-1" onClick={reset}>Reset</Button><SheetClose asChild><Button className="flex-1">Show results</Button></SheetClose></SheetFooter></SheetContent></Sheet>
      </div>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"><SubjectChip active={goal === "all"} onClick={() => selectGoal("all")}>All goals</SubjectChip>{goals.map((item) => <SubjectChip key={item} active={goal === item} onClick={() => selectGoal(item)}>{item}</SubjectChip>)}</div>
      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"><SubjectChip active={subject === "all"} onClick={() => setSubject("all")}>All subjects</SubjectChip>{subjects.map((item) => <SubjectChip key={item} active={subject === item} onClick={() => setSubject(item)}>{item}</SubjectChip>)}</div>
      {reviewCount > 0 && <Link href={questionHref({ ...(goal !== "all" && { goal }), ...(board !== "all" && { board }), ...(grade !== "all" && { grade }), ...(subject !== "all" && { subject }), status: "NEEDS_REVIEW" })} className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/30"><div><p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Needs revision</p><p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">Review {reviewCount} questions you marked</p></div><ArrowRight className="h-4 w-4 text-amber-700" /></Link>}
      <div className="mt-4 grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-semibold"><button onClick={() => setMobileView("chapters")} className={cn("rounded-md px-3 py-2 transition", mobileView === "chapters" && "bg-background shadow-sm")}>Chapters <span className="text-muted-foreground">{chapters.length}</span></button><button onClick={() => setMobileView("papers")} className={cn("rounded-md px-3 py-2 transition", mobileView === "papers" && "bg-background shadow-sm")}>Papers <span className="text-muted-foreground">{papers.length}</span></button></div>
      <div className="mt-2 overflow-hidden rounded-lg border bg-card">
        {mobileView === "chapters" ? <div className="divide-y">{chapters.map((chapter) => <Link key={`${chapter.goal}-${chapter.board}-${chapter.grade}-${chapter.subject}-${chapter.slug}`} href={questionHref({ goal: chapter.goal, board: chapter.board, grade: chapter.grade, subject: chapter.subject, chapter: chapter.slug })} className="flex min-h-14 items-center gap-3 px-3 py-2.5 active:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><BookOpen className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{chapter.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{chapter.subject}{subject === "all" ? ` · ${chapter.grade}` : ""}{chapter.solved > 0 ? ` · ${chapter.solved} solved` : ""}</p></div><span className="shrink-0 text-xs font-semibold tabular-nums">{chapter.questionCount}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></Link>)}{!chapters.length && <EmptyState onReset={reset} />}</div> : <div className="divide-y">{papers.map(({ collection, ...paper }) => <Link key={paper.id} href={`/practice/library/${collection.slug}/questions?paper=${paper.id}`} className="flex min-h-14 items-center gap-3 px-3 py-2.5 active:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted"><Files className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{paper.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{collection.school} · {paper.year}</p></div><span className="shrink-0 text-xs text-muted-foreground">{paper.questionCount} Q</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></Link>)}{!papers.length && <EmptyState onReset={reset} />}</div>}
      </div>
    </section>

    <div className="hidden space-y-5 md:block">
      <section className="rounded-lg border bg-card p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(5,minmax(120px,0.7fr))_auto]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search source or subject" /></div><FilterSelect value={goal} onChange={selectGoal} allLabel="All exam goals" values={goals} /><FilterSelect value={board} onChange={setBoard} allLabel="All boards" values={boards} /><FilterSelect value={grade} onChange={setGrade} allLabel="All classes" values={grades} /><FilterSelect value={subject} onChange={setSubject} allLabel="All subjects" values={subjects} /><FilterSelect value={school} onChange={setSchool} allLabel="All sources" values={unique(collections.map((item) => item.school))} /><Button variant="ghost" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button></div></section>
      <section><div className="mb-3"><h2 className="text-base font-bold">Available collections</h2><p className="mt-0.5 text-xs text-muted-foreground">{filtered.length} paper collections match your filters</p></div><div className="overflow-hidden rounded-lg border bg-card"><div className="hidden grid-cols-[minmax(260px,1fr)_110px_repeat(3,120px)] gap-3 border-b bg-muted/45 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid"><span>Paper source</span><span>Coverage</span><span>Papers</span><span>Questions</span><span>Chapters</span></div><div className="divide-y">{filtered.map((item) => { const base = `/practice/library/${item.slug}`; return <article key={item.slug} className="grid gap-4 p-4 lg:grid-cols-[minmax(260px,1fr)_110px_repeat(3,120px)] lg:items-center lg:gap-3 lg:px-5"><div className="flex min-w-0 gap-3"><span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/50"><Building2 className="h-4 w-4" /></span><div className="min-w-0"><div className="flex flex-wrap gap-1.5"><Badge variant="outline" className="h-5 text-[10px]">{item.goal}</Badge>{item.grade !== "Entrance exam" && <Badge variant="secondary" className="h-5 text-[10px] font-normal">{item.grade}</Badge>}<Badge variant="secondary" className="h-5 text-[10px] font-normal">{item.subject}</Badge></div><h3 className="mt-2 truncate text-sm font-semibold">{item.school}</h3><p className="mt-0.5 text-xs text-muted-foreground">{item.source}</p>{!!item.attemptedCount && <p className="mt-1 text-[11px] font-medium text-emerald-600">{item.solvedCount || 0} solved · {item.needsReviewCount || 0} to revise</p>}</div></div><div className="text-xs"><span className="text-muted-foreground">Goal</span><strong className="mt-1 block">{item.goal}</strong></div><MetricLink href={`${base}/papers`} icon={Files} label="Papers" value={item.paperCount} /><MetricLink href={`${base}/questions`} icon={FileQuestion} label="Questions" value={item.questionCount} /><MetricLink href={`${base}/chapters`} icon={BookOpen} label="Chapters" value={item.chapterCount} /></article>; })}</div>{!filtered.length && <EmptyState onReset={reset} />}</div></section>
    </div>
  </>;
};

const SubjectChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => <button onClick={onClick} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition", active ? "border-blue-600 bg-blue-600 text-white" : "bg-card text-muted-foreground")}>{children}</button>;
const FilterSelect = ({ label, value, onChange, allLabel, values }: { label?: string; value: string; onChange: (value: string) => void; allLabel: string; values: string[] }) => <label className="grid gap-1.5">{label && <span className="text-xs font-medium">{label}</span>}<Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{allLabel}</SelectItem>{values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>;
const EmptyState = ({ onReset }: { onReset: () => void }) => <div className="px-4 py-10 text-center"><FileQuestion className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">No matching material</p><Button variant="link" size="sm" onClick={onReset}>Clear filters</Button></div>;
const MetricLink = ({ href, icon: Icon, label, value }: { href: string; icon: typeof Files; label: string; value: number }) => <Link href={href} className="group flex items-center justify-between rounded-md border bg-background p-3 transition hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/25 lg:block lg:border-0 lg:bg-transparent lg:p-0"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span><strong className="text-lg group-hover:text-blue-600 lg:mt-1 lg:block">{value}</strong></Link>;
