"use client";

import axios from "axios";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { MathText } from "@/components/math-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

type ContestAttemptQuestion = {
  id: string;
  marks: number | null;
  question: {
    id: string;
    questionText: string;
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERICAL" | "TRUE_FALSE";
    defaultMarks: number;
    negativeMarks: number;
    options: {
      id: string;
      optionText: string;
      position: number;
    }[];
  };
};

interface ContestAttemptFormProps {
  contestId: string;
  title: string;
  expiresAt: string;
  questions: ContestAttemptQuestion[];
}

const MAX_TAB_SWITCHES = 3;

const formatRemainingTime = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const answerAsText = (answer: string | string[] | undefined) =>
  Array.isArray(answer) ? answer.join(",") : answer || "";

const answerAsList = (answer: string | string[] | undefined) =>
  Array.isArray(answer) ? answer : answer ? [answer] : [];

export const ContestAttemptForm = ({
  contestId,
  title,
  expiresAt,
  questions,
}: ContestAttemptFormProps) => {
  const router = useRouter();
  const hasSubmittedRef = useRef(false);
  const lastViolationAtRef = useRef(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingMs, setRemainingMs] = useState(
    new Date(expiresAt).getTime() - Date.now()
  );

  const answerPayload = useMemo(
    () =>
      questions.map((item) => ({
        questionId: item.question.id,
        selectedAnswer: answerAsText(answers[item.question.id]),
      })),
    [answers, questions]
  );

  const submitAttempt = useCallback(
    async (autoSubmitted = false) => {
      if (hasSubmittedRef.current) return;

      try {
        hasSubmittedRef.current = true;
        setIsSubmitting(true);
        await axios.post(`/api/contests/${contestId}/submit`, {
          answers: answerPayload,
          autoSubmitted,
        });
        toast.success(autoSubmitted ? "Contest auto-submitted" : "Contest submitted");
        router.refresh();
      } catch (error: any) {
        hasSubmittedRef.current = false;
        toast.error(error?.response?.data || "Could not submit contest");
      } finally {
        setIsSubmitting(false);
      }
    },
    [answerPayload, contestId, router]
  );

  const registerViolation = useCallback(() => {
    if (hasSubmittedRef.current) return;

    const now = Date.now();
    if (now - lastViolationAtRef.current < 1200) return;
    lastViolationAtRef.current = now;

    setTabSwitchCount((current) => {
      const next = current + 1;

      if (next >= MAX_TAB_SWITCHES) {
        void submitAttempt(true);
      } else {
        toast.error(`Do not switch tabs. Warning ${next}/${MAX_TAB_SWITCHES}`);
      }

      return next;
    });
  }, [submitAttempt]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) registerViolation();
    };
    const onBlur = () => registerViolation();
    const onBlockedShortcut = (event: KeyboardEvent) => {
      if (
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key.toUpperCase()))
      ) {
        event.preventDefault();
        registerViolation();
      }
    };
    const blockEvent = (event: Event) => event.preventDefault();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onBlockedShortcut);
    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("paste", blockEvent);
    document.addEventListener("contextmenu", blockEvent);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onBlockedShortcut);
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("paste", blockEvent);
      document.removeEventListener("contextmenu", blockEvent);
    };
  }, [registerViolation]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
        void submitAttempt(true);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt, submitAttempt]);

  const setSingleAnswer = (questionId: string, optionId: string) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  };

  const setMultipleAnswer = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((current) => {
      const currentAnswers = answerAsList(current[questionId]);

      return {
        ...current,
        [questionId]: checked
          ? Array.from(new Set([...currentAnswers, optionId]))
          : currentAnswers.filter((id) => id !== optionId),
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <p className="text-xs text-slate-400">Stay on this page until submission.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-amber-300/30 bg-amber-300/10 text-amber-100">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              {tabSwitchCount}/{MAX_TAB_SWITCHES} warnings
            </Badge>
            <Badge className="border-blue-300/30 bg-blue-300/10 text-blue-100">
              <Clock className="mr-1 h-3.5 w-3.5" />
              {formatRemainingTime(remainingMs)}
            </Badge>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <div className="rounded-md border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              Switching tabs, minimizing the browser, opening developer tools, or leaving the
              contest window will be recorded. The attempt auto-submits after {MAX_TAB_SWITCHES} warnings.
            </p>
          </div>
        </div>

        {questions.map((item, index) => {
          const question = item.question;
          const currentAnswer = answers[question.id];
          const selected = answerAsList(currentAnswer);
          const isMultiple = question.questionType === "MULTIPLE_CHOICE";
          const isNumerical = question.questionType === "NUMERICAL";

          return (
            <section
              key={item.id}
              className="rounded-md border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-100">Question {index + 1}</p>
                  <div className="mt-2 text-base leading-7 text-white">
                    <MathText value={question.questionText} />
                  </div>
                </div>
                <Badge className="w-fit border-white/10 bg-white/[0.06] text-slate-200">
                  {item.marks ?? question.defaultMarks} marks
                </Badge>
              </div>

              {isNumerical ? (
                <Textarea
                  className="mt-4 min-h-[72px] bg-slate-900 text-white"
                  placeholder="Enter your answer"
                  value={selected[0] || ""}
                  onChange={(event) => setSingleAnswer(question.id, event.target.value)}
                />
              ) : (
                <div className="mt-4 grid gap-2">
                  {question.options.map((option) => {
                    const checked = selected.includes(option.id);

                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-white/10 bg-slate-900/70 p-3 transition hover:bg-slate-900"
                      >
                        {isMultiple ? (
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setMultipleAnswer(question.id, option.id, value === true)
                            }
                          />
                        ) : (
                          <input
                            checked={checked}
                            className="mt-1"
                            name={question.id}
                            type="radio"
                            onChange={() => setSingleAnswer(question.id, option.id)}
                          />
                        )}
                        <MathText value={option.optionText} className="text-sm text-slate-100" />
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        <div className="sticky bottom-0 border-t border-white/10 bg-slate-950/95 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-5xl justify-end">
            <Button
              disabled={isSubmitting}
              onClick={() => void submitAttempt(false)}
              type="button"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit contest"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
