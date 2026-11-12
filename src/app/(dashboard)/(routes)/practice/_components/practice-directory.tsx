"use client";

import { useMemo, useState } from "react";
import { BookOpen, Building2, FileQuestion, Files, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PracticeCollection } from "@/lib/practice-catalog";

const unique = (values: string[]) => Array.from(new Set(values)).sort();

export const PracticeDirectory = ({ collections }: { collections: PracticeCollection[] }) => {
  const [board, setBoard] = useState("all"); const [grade, setGrade] = useState("all"); const [subject, setSubject] = useState("all"); const [school, setSchool] = useState("all"); const [query, setQuery] = useState("");
  const filtered = useMemo(() => collections.filter((item) => (board === "all" || item.board === board) && (grade === "all" || item.grade === grade) && (subject === "all" || item.subject === subject) && (school === "all" || item.school === school) && `${item.board} ${item.grade} ${item.subject} ${item.school}`.toLowerCase().includes(query.toLowerCase())), [board, collections, grade, query, school, subject]);
  const reset = () => { setBoard("all"); setGrade("all"); setSubject("all"); setSchool("all"); setQuery(""); };
  return <>
    <section className="rounded-lg border bg-card p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(4,minmax(130px,0.7fr))_auto]">
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Search school or subject" /></div>
      <Select value={board} onValueChange={setBoard}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All boards</SelectItem>{unique(collections.map(i => i.board)).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
      <Select value={grade} onValueChange={setGrade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Classes 8–12</SelectItem>{unique(collections.map(i => i.grade)).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
      <Select value={subject} onValueChange={setSubject}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All subjects</SelectItem>{unique(collections.map(i => i.subject)).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
      <Select value={school} onValueChange={setSchool}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All schools</SelectItem>{unique(collections.map(i => i.school)).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
      <Button variant="ghost" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
    </div></section>
    <section><div className="mb-3"><h2 className="text-base font-bold">Available collections</h2><p className="mt-0.5 text-xs text-muted-foreground">{filtered.length} school and board collections match your filters</p></div>
      <div className="overflow-hidden rounded-lg border bg-card"><div className="hidden grid-cols-[minmax(260px,1fr)_110px_repeat(3,120px)] gap-3 border-b bg-muted/45 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid"><span>School / board source</span><span>Coverage</span><span>Papers</span><span>Questions</span><span>Chapters</span></div><div className="divide-y">
        {filtered.map(item => { const base = `/practice/library/${item.slug}`; return <article key={item.slug} className="grid gap-4 p-4 lg:grid-cols-[minmax(260px,1fr)_110px_repeat(3,120px)] lg:items-center lg:gap-3 lg:px-5">
          <div className="flex min-w-0 gap-3"><span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/50"><Building2 className="h-4 w-4" /></span><div className="min-w-0"><div className="flex flex-wrap gap-1.5"><Badge variant="outline" className="h-5 text-[10px]">{item.board}</Badge><Badge variant="secondary" className="h-5 text-[10px] font-normal">{item.grade}</Badge><Badge variant="secondary" className="h-5 text-[10px] font-normal">{item.subject}</Badge></div><h3 className="mt-2 truncate text-sm font-semibold">{item.school}</h3><p className="mt-0.5 text-xs text-muted-foreground">{item.source}</p></div></div><div className="text-xs"><span className="text-muted-foreground">Years</span><strong className="mt-1 block">2022–2025</strong></div>
          <MetricLink href={`${base}/papers`} icon={Files} label="Papers" value={item.paperCount} /><MetricLink href={`${base}/questions`} icon={FileQuestion} label="Questions" value={item.questionCount} /><MetricLink href={`${base}/chapters`} icon={BookOpen} label="Chapters" value={item.chapterCount} />
        </article>; })}
      </div>{!filtered.length && <div className="py-16 text-center"><FileQuestion className="mx-auto h-7 w-7 text-muted-foreground" /><h3 className="mt-3 text-sm font-semibold">No matching collections</h3><Button variant="outline" size="sm" className="mt-4" onClick={reset}>Clear filters</Button></div>}</div>
    </section>
  </>;
};

const MetricLink = ({ href, icon: Icon, label, value }: { href: string; icon: typeof Files; label: string; value: number }) => <Link href={href} className="group flex items-center justify-between rounded-md border bg-background p-3 transition hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/25 lg:block lg:border-0 lg:bg-transparent lg:p-0"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span><strong className="text-lg group-hover:text-blue-600 lg:mt-1 lg:block">{value}</strong></Link>;
