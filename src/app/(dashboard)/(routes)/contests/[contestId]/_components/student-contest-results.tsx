import type { QuestionType } from "@prisma/client";
import { CheckCircle2, Clock3, MinusCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/math-text";
import { cn } from "@/lib/utils";

type ResultQuestion = {
  position: number;
  marks: number | null;
  question: {
    id: string;
    questionText: string;
    questionType: QuestionType;
    defaultMarks: number;
    imageUrl: string | null;
    explanation: string | null;
    options: {
      id: string;
      optionText: string;
      isCorrect: boolean;
      position: number;
    }[];
  };
};

type ResultAnswer = {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  marksAwarded: number | null;
};

type ResultState = "correct" | "incorrect" | "unanswered" | "pending" | "graded";

function answerText(value: string | null, question: ResultQuestion["question"]) {
  if (!value?.trim()) return "No answer submitted";
  if (question.questionType === "NUMERICAL" || !question.options.length) return value;

  return value
    .split(",")
    .map(id => question.options.find(option => option.id === id.trim())?.optionText || "Unavailable option")
    .join("; ");
}

export function StudentContestResults({
  attempt,
  questions,
}: {
  attempt: {
    score: number | null;
    totalMarks: number | null;
    percentage: number | null;
    answers: ResultAnswer[];
  };
  questions: ResultQuestion[];
}) {
  const answers = new Map(attempt.answers.map(answer => [answer.questionId, answer]));
  const results = questions.map(item => {
    const answer = answers.get(item.question.id);
    const answered = !!answer?.selectedAnswer?.trim();
    const state: ResultState = !answered
      ? "unanswered"
      : answer?.marksAwarded === null || answer?.marksAwarded === undefined
        ? "pending"
        : answer.isCorrect === true
          ? "correct"
          : answer.isCorrect === false
            ? "incorrect"
            : "graded";
    return { item, answer, state };
  });
  const correct = results.filter(result => result.state === "correct").length;
  const incorrect = results.filter(result => result.state === "incorrect").length;
  const pending = questions.filter(item => {
    const marks = answers.get(item.question.id)?.marksAwarded;
    return marks === null || marks === undefined;
  }).length;
  const unanswered = results.filter(result => result.state === "unanswered").length;
  const hasPendingGrading = questions.some(item => {
    const marks = answers.get(item.question.id)?.marksAwarded;
    return marks === null || marks === undefined;
  });

  return (
    <section aria-labelledby="answer-review-heading" className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Your performance</p>
          <h2 id="answer-review-heading" className="mt-1 text-2xl font-semibold">Answer review</h2>
          <p className="mt-1 text-sm text-muted-foreground">Compare your responses with the evaluated answers.</p>
        </div>
        {attempt.score !== null && attempt.totalMarks !== null && (
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">{hasPendingGrading ? "Provisional score" : "Final score"}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{attempt.score} / {attempt.totalMarks}</p>
            {attempt.percentage !== null && <p className="text-sm tabular-nums text-muted-foreground">{Math.round(attempt.percentage * 10) / 10}%</p>}
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-4">
        {[
          { label: "Correct", value: correct, icon: CheckCircle2, color: "text-emerald-700 dark:text-emerald-300" },
          { label: "Incorrect", value: incorrect, icon: XCircle, color: "text-rose-700 dark:text-rose-300" },
          { label: "Unanswered", value: unanswered, icon: MinusCircle, color: "text-muted-foreground" },
          { label: "Awaiting review", value: pending, icon: Clock3, color: "text-amber-700 dark:text-amber-300" },
        ].map(metric => (
          <div key={metric.label} className="min-w-0 bg-background p-4">
            <metric.icon className={cn("h-4 w-4", metric.color)} />
            <dd className="mt-3 text-xl font-semibold tabular-nums">{metric.value}</dd>
            <dt className="mt-1 truncate text-xs text-muted-foreground">{metric.label}</dt>
          </div>
        ))}
      </dl>

      <div className="space-y-4">
        {results.map(({ item, answer, state }, index) => {
          const question = item.question;
          const correctOptions = question.options.filter(option => option.isCorrect);
          const status: Record<ResultState, { label: string; color: string }> = {
            correct: { label: "Correct", color: "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300" },
            incorrect: { label: "Incorrect", color: "border-rose-300 text-rose-800 dark:border-rose-800 dark:text-rose-300" },
            unanswered: { label: "Unanswered", color: "" },
            pending: { label: "Awaiting review", color: "border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-300" },
            graded: { label: "Graded", color: "border-blue-300 text-blue-800 dark:border-blue-800 dark:text-blue-300" },
          };

          return (
            <article key={question.id} aria-label={`Question ${index + 1}`} className="min-w-0 rounded-md border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Question {index + 1} / {item.marks ?? question.defaultMarks} marks</p>
                  <MathText value={question.questionText} className="mt-2 max-w-full break-words font-medium" />
                </div>
                <Badge variant="outline" className={status[state].color}>{status[state].label}</Badge>
              </div>

              {question.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={question.imageUrl} alt={`Diagram for question ${index + 1}`} className="mt-4 max-h-80 max-w-full object-contain" />
              )}

              <div className="mt-5 grid min-w-0 gap-5 border-t pt-4 md:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Your answer</p>
                  <MathText value={answerText(answer?.selectedAnswer || null, question)} className="max-w-full whitespace-pre-wrap break-words text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Correct answer</p>
                  {correctOptions.length
                    ? <div className="space-y-1">{correctOptions.map(option => (
                      <MathText key={option.id} value={option.optionText} className="block max-w-full break-words text-sm" />
                    ))}</div>
                    : <p className="text-sm text-muted-foreground">
                      {question.questionType === "NUMERICAL" || !question.options.length
                        ? "This response is reviewed by the teacher."
                        : "Answer key is not available yet."}
                    </p>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                <span className="text-muted-foreground">Marks awarded</span>
                <span className="font-medium tabular-nums">
                  {answer?.marksAwarded === null || answer?.marksAwarded === undefined
                    ? "Pending"
                    : `${answer.marksAwarded} / ${item.marks ?? question.defaultMarks}`}
                </span>
              </div>

              {question.explanation && (
                <div className="mt-4 border-l-2 border-blue-500 bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Explanation</p>
                  <MathText value={question.explanation} className="max-w-full whitespace-pre-wrap break-words text-sm" />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
