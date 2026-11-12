"use client";

import axios from "axios";
import { AlertTriangle, BookOpenCheck, Download, FileSearch, Loader2, Save, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Draft = { id?: string; questionText: string; questionType: string; defaultMarks: number; chapterTitle: string; answer?: string; explanation?: string; formula?: string; sourcePage?: number | null; options: { optionText: string; isCorrect: boolean }[] };
type Scope = { board: string; grade: string; subject: string } | null;

export const ResourceQuestionManager = ({ resourceId, originalUrl, existingQuestions, isPublished, scope, availableChapters }: { resourceId: string; originalUrl: string; existingQuestions: Draft[]; isPublished: boolean; scope: Scope; availableChapters: { id: string; title: string }[] }) => {
  const router = useRouter();
  const [drafts, setDrafts] = useState(existingQuestions);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const [confirmReextract, setConfirmReextract] = useState(false);
  const [meta, setMeta] = useState<{ pageCount: number; parserMode: string; failedChunks: { startPage: number; endPage: number }[] } | null>(null);

  const persisted = drafts.length > 0 && drafts.every((draft) => Boolean(draft.id));
  const missingAnswers = drafts.filter((draft) => !draft.answer?.trim()).length;
  const chapterTitles = Array.from(new Set(drafts.map((draft) => draft.chapterTitle?.trim() || "Unclassified"))).sort();
  const visibleDrafts = useMemo(() => drafts.map((draft, index) => ({ draft, index })).filter(({ draft }) => {
    const matchesFilter = filter === "all" || !draft.answer?.trim();
    const searchable = `${draft.questionText} ${draft.chapterTitle} ${draft.answer || ""}`.toLowerCase();
    return matchesFilter && searchable.includes(query.toLowerCase());
  }), [drafts, filter, query]);

  const update = (index: number, patch: Partial<Draft>) => setDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const mapChapter = (from: string, to: string) => setDrafts((current) => current.map((item) => (item.chapterTitle?.trim() || "Unclassified") === from ? { ...item, chapterTitle: to } : item));

  const parse = async () => {
    try {
      setParsing(true);
      const response = await axios.post(`/api/question-bank/parse-pdf?resourceId=${encodeURIComponent(resourceId)}`);
      const questions = (response.data.questions || []).map((question: Draft & { practiceType?: string }) => ({ ...question, id: undefined, questionType: question.practiceType || question.questionType }));
      setDrafts(questions);
      setMeta(response.data.meta || null);
      setFilter("all");
      toast.success(`${questions.length} replacement drafts extracted`);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data : null;
      toast.error(typeof message === "string" ? message : "Extraction took too long or failed. Please retry this paper.");
    } finally {
      setParsing(false);
      setConfirmReextract(false);
    }
  };

  const save = async () => {
    if (!drafts.length) return toast.error("Extract questions first");
    const questions = drafts.map((item) => ({ ...item, marks: Number(item.defaultMarks) || 1, solution: item.explanation || "" }));
    try {
      setSaving(true);
      if (persisted) {
        await axios.patch(`/api/resources/${resourceId}/questions`, { questions });
        toast.success("Question changes saved. Student attempts were preserved.");
      } else {
        const response = await axios.post(`/api/resources/${resourceId}/questions`, { publish: true, questions });
        toast.success(`${response.data.count} questions published`);
      }
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || error.response?.data || "Could not save questions" : "Could not save questions");
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-6">
    <section className="rounded-lg border bg-card p-4 sm:p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><h2 className="font-semibold">{persisted ? "Manage published questions" : "Extract questions from the paper"}</h2>{isPublished && <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Published</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{persisted ? "Edit answers safely without resetting student progress." : "AI creates reviewable question and chapter drafts."}</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={originalUrl} target="_blank"><Download className="mr-2 h-4 w-4" />Original</Link></Button><Button variant={persisted ? "outline" : "default"} onClick={() => persisted ? setConfirmReextract(true) : parse()} disabled={parsing}>{parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{parsing ? "Extracting…" : persisted ? "Re-extract PDF" : "Extract questions"}</Button></div></div>{meta && <div className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{meta.pageCount} pages · {meta.parserMode === "vision_ocr" ? "OCR used" : "text extraction"}{meta.failedChunks.length ? ` · ${meta.failedChunks.length} page ranges need attention` : " · all chunks processed"}</div>}</section>

    {drafts.length ? <>
      <section className="rounded-lg border bg-card p-4 sm:p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-blue-600" /><h2 className="font-semibold">Chapter mapping</h2></div><p className="mt-1 text-xs text-muted-foreground">One change updates every question using that chapter label.</p></div>{scope && <div className="flex flex-wrap gap-1.5"><Badge variant="outline">{scope.board}</Badge><Badge variant="secondary">{scope.grade}</Badge><Badge variant="secondary">{scope.subject}</Badge></div>}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{chapterTitles.map((title) => { const choices = Array.from(new Set([title, ...availableChapters.map((chapter) => chapter.title)])).sort(); const count = drafts.filter((draft) => (draft.chapterTitle?.trim() || "Unclassified") === title).length; return <div key={title} className="rounded-md border bg-muted/20 p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold">Chapter</span><Badge variant="outline" className="h-5 text-[10px]">{count} questions</Badge></div><Select value={title} onValueChange={(value) => mapChapter(title, value)}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent>{choices.map((choice) => <SelectItem key={choice} value={choice}>{choice}{choice === title && !availableChapters.some((chapter) => chapter.title === choice) ? " (new)" : ""}</SelectItem>)}</SelectContent></Select></div>; })}</div></section>

      <section><div className="mb-3 flex flex-col gap-3"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="font-semibold">Answers and solutions</h2><p className="mt-1 text-xs text-muted-foreground">{drafts.length} questions · {missingAnswers ? `${missingAnswers} answers still missing` : "all questions have answers"}</p></div><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? "Saving…" : persisted ? "Save changes" : "Publish to Practice"}</Button></div><div className="grid gap-2 sm:grid-cols-[1fr_180px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions or chapters" className="pl-9" /></div><Select value={filter} onValueChange={(value: "all" | "missing") => setFilter(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All questions</SelectItem><SelectItem value="missing">Missing answers ({missingAnswers})</SelectItem></SelectContent></Select></div></div>
        <div className="space-y-3">{visibleDrafts.map(({ draft, index }) => <article key={draft.id || index} className="rounded-lg border bg-card p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant="outline">Q{index + 1}</Badge><Badge variant="secondary">{draft.chapterTitle || "Unclassified"}</Badge><span className="ml-auto text-xs text-muted-foreground">{draft.defaultMarks} marks</span></div><label className="text-xs font-medium">Question</label><Textarea className="mt-1 min-h-20" value={draft.questionText} onChange={(event) => update(index, { questionText: event.target.value })} /><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label className="text-xs font-medium">Answer {draft.answer?.trim() ? null : <span className="text-amber-600">· missing</span>}</label><Textarea className="mt-1 min-h-24" value={draft.answer || ""} onChange={(event) => update(index, { answer: event.target.value })} placeholder="Enter the expected answer" /></div><div><label className="text-xs font-medium">Solution / explanation</label><Textarea className="mt-1 min-h-24" value={draft.explanation || ""} onChange={(event) => update(index, { explanation: event.target.value })} placeholder="Add working, explanation or marking points" /></div></div><details className="mt-3 rounded-md border bg-muted/20 px-3 py-2"><summary className="cursor-pointer text-xs font-medium text-muted-foreground">Question settings</summary><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_110px]"><div><label className="text-xs font-medium">Chapter</label><Input className="mt-1" value={draft.chapterTitle || ""} onChange={(event) => update(index, { chapterTitle: event.target.value })} /></div><div><label className="text-xs font-medium">Type</label><Input className="mt-1" value={draft.questionType} onChange={(event) => update(index, { questionType: event.target.value })} /></div><div><label className="text-xs font-medium">Marks</label><Input className="mt-1" type="number" min="0.5" step="0.5" value={draft.defaultMarks} onChange={(event) => update(index, { defaultMarks: Number(event.target.value) })} /></div></div></details></article>)}{!visibleDrafts.length && <div className="rounded-lg border border-dashed py-12 text-center"><p className="text-sm font-semibold">No questions match this view</p><Button variant="link" size="sm" onClick={() => { setFilter("all"); setQuery(""); }}>Show all questions</Button></div>}</div>
      </section>
    </> : <section className="rounded-lg border border-dashed py-16 text-center"><FileSearch className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No questions extracted yet</h2><p className="mt-1 text-sm text-muted-foreground">Use the uploaded original paper to create reviewable drafts.</p></section>}

    <AlertDialog open={confirmReextract} onOpenChange={setConfirmReextract}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Replace extracted questions?</AlertDialogTitle><AlertDialogDescription>Re-extraction creates a new set of question records. Existing student practice attempts for this paper will be cleared only when you publish those replacement drafts. Use “Save changes” when you only want to edit answers.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current questions</AlertDialogCancel><AlertDialogAction onClick={parse}>Continue re-extraction</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
};
