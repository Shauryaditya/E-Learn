"use client";

import { AlertTriangle, CheckCircle2, Clock, UploadCloud, Loader2, RotateCw, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MathText } from "@/components/math-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContestAttempt } from "./use-contest-attempt";

type ContestAttemptQuestion = {
  id: string;
  marks: number | null;
  question: {
    id: string;
    questionText: string;
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERICAL" | "TRUE_FALSE";
    defaultMarks: number;
    imageUrl: string | null;
    options: { id: string; optionText: string; position: number }[];
  };
};

interface ContestAttemptFormProps {
  attemptId: string;
  contestId: string;
  title: string;
  expiresAt: string;
  questions: ContestAttemptQuestion[];
}

const MAX_TAB_SWITCHES = 3;
const formatRemainingTime = (milliseconds: number | null) => {
  if (milliseconds === null) return "--:--";
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
};

export const ContestAttemptForm = ({ attemptId, contestId, title, expiresAt, questions }: ContestAttemptFormProps) => {
  const attempt = useContestAttempt(attemptId, contestId, expiresAt);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const violations = useRef(0);
  const [marked, setMarked] = useState<string[]>([]);
  const answered = questions.filter(item => attempt.answers[item.question.id]?.trim()).length;
  const locked = !attempt.ready || attempt.finishing || attempt.submitted || attempt.conflict || attempt.remainingMs === 0;
  const submitRef = useRef(attempt.submit);
  submitRef.current = attempt.submit;

  useEffect(() => {
    const key = `contest-warnings:${attemptId}`;
    try {
      violations.current = Math.max(0, Number(sessionStorage.getItem(key)) || 0);
      setTabSwitchCount(violations.current);
    } catch {}
    let leaving = false;
    let hiddenAt: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let counted = false;
    const countWarning = () => {
      if (leaving || locked || counted) return;
      counted = true;
      violations.current += 1;
      setTabSwitchCount(violations.current);
      try { sessionStorage.setItem(key, String(violations.current)); } catch {}
      if (violations.current >= MAX_TAB_SWITCHES) submitRef.current(true);
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = performance.now();
        counted = false;
        // Navigation also hides the document. Allow pagehide to distinguish a refresh.
        timer = setTimeout(countWarning, 1500);
      } else {
        clearTimeout(timer);
        if (hiddenAt !== null && performance.now() - hiddenAt >= 1500) countWarning();
        hiddenAt = null;
      }
    };
    const onPageHide = () => { leaving = true; clearTimeout(timer); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [attemptId, locked]);

  if (attempt.submitted) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-foreground">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-semibold">Submission received</h1>
        <p>Your answers for {title} have been saved.</p>
        {attempt.submissionNotice && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{attempt.submissionNotice}</p>}
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCw className="mr-2 h-4 w-4" /> View attempt
        </Button>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 break-words text-lg font-semibold">{title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2" role="status">
              <UploadCloud className="h-4 w-4 shrink-0" />{attempt.saveState}
            </span>
            <Badge variant="outline" className="gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />{tabSwitchCount}/{MAX_TAB_SWITCHES}
            </Badge>
            <span className="inline-flex w-24 items-center justify-center gap-2 font-mono tabular-nums" aria-label="Time remaining">
              <Clock className="h-4 w-4" />{formatRemainingTime(attempt.remainingMs)}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_220px]">
        <div className="min-w-0 space-y-4">
          {attempt.error && (
            <div role="alert" className="space-y-3 rounded-md border border-destructive/50 p-4 text-sm">
              <p>{attempt.error}</p>
              {attempt.conflict && (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RotateCw className="mr-2 h-4 w-4" /> Recover saved answers
                </Button>
              )}
            </div>
          )}
          <div className="flex items-start gap-3 border-l-2 border-amber-500 bg-muted/40 p-4 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>Leaving this tab adds a warning. After {MAX_TAB_SWITCHES} warnings, your attempt is submitted automatically.
              {tabSwitchCount > 0 && ` You have ${tabSwitchCount} warning(s).`}
            </p>
          </div>
          {!attempt.ready && <p role="status" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Recovering your attempt...</p>}
          {questions.map((item, index) => {
            const question = item.question;
            const value = attempt.answers[question.id] || "";
            const selected = value ? value.split(",") : [];
            const multiple = question.questionType === "MULTIPLE_CHOICE";
            const isMarked = marked.includes(question.id);
            return (
              <section key={item.id} id={`question-${index + 1}`} className="scroll-mt-32 rounded-md border p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Question {index + 1}</h2>
                  <Badge variant="outline">{item.marks ?? question.defaultMarks} marks</Badge>
                </div>
                <MathText value={question.questionText} className="break-words text-base leading-7" />
                {question.imageUrl && (
                  // Imported question diagrams can come from multiple attachment hosts.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={question.imageUrl} alt={`Diagram for question ${index + 1}`} className="mt-3 max-h-96 max-w-full object-contain" />
                )}
                <fieldset disabled={locked} className="mt-4 min-w-0 space-y-2 disabled:opacity-60" aria-label={`Answer for question ${index + 1}`}>
                  {question.questionType === "NUMERICAL" ? (
                    <Textarea aria-label={`Answer for question ${index + 1}`} placeholder="Enter your answer" value={value}
                      onChange={event => attempt.changeAnswer(question.id, event.target.value)} className="min-h-24" maxLength={10000} />
                  ) : question.options.map(option => (
                    <label key={option.id} className="flex min-w-0 cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
                      {multiple ? (
                        <Checkbox checked={selected.includes(option.id)} disabled={locked}
                          onCheckedChange={checked => attempt.changeAnswer(question.id,
                            (checked ? Array.from(new Set([...selected, option.id])) : selected.filter(id => id !== option.id)).join(","))} />
                      ) : (
                        <input type="radio" name={question.id} checked={value === option.id} className="mt-1 shrink-0"
                          onChange={() => attempt.changeAnswer(question.id, option.id)} />
                      )}
                      <MathText value={option.optionText} className="min-w-0 break-words text-sm" />
                    </label>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button type="button" size="sm" variant="ghost" disabled={locked || !value} onClick={() => attempt.changeAnswer(question.id, "")}>
                      Clear answer
                    </Button>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={isMarked} disabled={locked} onCheckedChange={checked =>
                        setMarked(current => checked ? [...current, question.id] : current.filter(id => id !== question.id))} />
                      Review later
                    </label>
                  </div>
                </fieldset>
              </section>
            );
          })}
        </div>

        <aside className="order-first min-w-0 lg:order-last">
          <div className="space-y-4 lg:sticky lg:top-28">
            <p className="text-sm font-medium">{answered} of {questions.length} answered</p>
            <nav className="grid grid-cols-[repeat(auto-fill,40px)] gap-2" aria-label="Questions">
              {questions.map((item, index) => {
                const hasAnswer = !!attempt.answers[item.question.id]?.trim();
                const review = marked.includes(item.question.id);
                return <a key={item.id} href={`#question-${index + 1}`}
                  aria-label={`Question ${index + 1}, ${hasAnswer ? "answered" : "unanswered"}${review ? ", marked for review" : ""}`}
                  className={`flex h-10 w-10 items-center justify-center rounded border text-sm tabular-nums ${hasAnswer ? "bg-primary text-primary-foreground" : "bg-background"} ${review ? "ring-2 ring-amber-500" : ""}`}>
                  {index + 1}
                </a>;
              })}
            </nav>
            <Button className="w-full" disabled={!attempt.ready || attempt.isSubmitting || (attempt.conflict && attempt.remainingMs !== 0)}
              onClick={() => attempt.finishing ? attempt.submit() : setConfirmOpen(true)}>
              {attempt.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {attempt.isSubmitting ? "Submitting..." : attempt.finishing ? "Retry submission" : "Submit contest"}
            </Button>
          </div>
        </aside>
      </main>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your attempt?</AlertDialogTitle>
            <AlertDialogDescription>
              {answered} of {questions.length} questions answered. {questions.length - answered} unanswered.
              Your answers cannot be changed after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue exam</AlertDialogCancel>
            <AlertDialogAction onClick={() => attempt.submit()}>Submit attempt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
