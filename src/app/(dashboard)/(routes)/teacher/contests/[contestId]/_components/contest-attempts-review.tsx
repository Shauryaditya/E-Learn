import type { QuestionType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/math-text";
import { formatContestDateTime } from "@/lib/contest-time";
import { submissionStatus } from "@/lib/contest-submissions";

export type ContestQuestionForReview = {
  position: number;
  marks: number | null;
  question: {
    id: string; questionText: string; questionType: QuestionType; defaultMarks: number;
    imageUrl?: string | null; explanation?: string | null;
    options: { id: string; optionText: string; isCorrect: boolean; position: number }[];
  };
};
export type ContestRegistrationForReview = {
  id: string; userId: string; status: string; createdAt: Date;
  attempt: {
    status: string; score: number | null; totalMarks: number | null;
    startedAt: Date; submittedAt: Date | null; expiresAt: Date;
    answers: { questionId: string; selectedAnswer: string | null; isCorrect: boolean | null; marksAwarded: number | null }[];
  } | null;
};

function selectedText(value: string | null, question: ContestQuestionForReview["question"]) {
  if (!value?.trim()) return "No answer";
  if (question.questionType === "NUMERICAL" || !question.options.length) return value;
  return value.split(",").map(id => question.options.find(option => option.id === id.trim())?.optionText || "Unavailable option").join("; ");
}

export function ContestAttemptReview({ registration, questions, student, now }: {
  registration: ContestRegistrationForReview; questions: ContestQuestionForReview[];
  student: { name: string; email: string }; now: Date;
}) {
  const attempt = registration.attempt;
  const answers = new Map(attempt?.answers.map(answer => [answer.questionId, answer]) || []);
  const completed = attempt && attempt.status !== "IN_PROGRESS";
  const awaitingGrading = completed && (attempt.answers.some(answer => answer.marksAwarded === null) || attempt.answers.length < questions.length);
  const answered = questions.filter(item => answers.get(item.question.id)?.selectedAnswer?.trim()).length;
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold">{student.name}</h2>
          <p className="mt-1 break-all text-sm text-muted-foreground">{student.email}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">Student ID: {registration.userId}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{submissionStatus(attempt, now)}</Badge>
            {registration.status !== "REGISTERED" && <Badge variant="outline">
              {registration.status === "CANCELLED" ? "Cancelled registration" : "Disqualified"}
            </Badge>}
            {awaitingGrading && <Badge variant="outline">Awaiting grading</Badge>}
          </div>
        </div>
        {completed && attempt.score !== null && attempt.totalMarks !== null && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{awaitingGrading ? "Provisional score" : "Score"}</p>
            <p className="text-2xl font-semibold tabular-nums">{attempt.score} / {attempt.totalMarks}</p>
          </div>
        )}
      </div>

      <dl className="grid gap-4 border-y py-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Registered", formatContestDateTime(registration.createdAt)],
          ["Started", attempt ? formatContestDateTime(attempt.startedAt) : "Not started"],
          ["Submitted", attempt?.submittedAt ? formatContestDateTime(attempt.submittedAt) : "Not submitted"],
          ["Deadline", attempt ? formatContestDateTime(attempt.expiresAt) : "No attempt"],
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1">{value}</dd></div>)}
      </dl>

      {!attempt ? <p className="py-8 text-sm text-muted-foreground">This student has not started an attempt.</p> : <>
        {!completed && <p role="status" className="border-l-2 border-amber-500 bg-muted/40 p-3 text-sm">
          {attempt.expiresAt <= now ? "Time has expired. These are saved responses; submission has not been confirmed." : "This attempt is in progress. Responses may change until submission."}
        </p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-medium">Responses</h3>
          <p className="text-sm text-muted-foreground">{answered} of {questions.length} answered</p>
        </div>
        <div className="space-y-4">
          {questions.map((item, index) => {
            const question = item.question;
            const answer = answers.get(question.id);
            const hasAnswer = !!answer?.selectedAnswer?.trim();
            const correctOptions = question.options.filter(option => option.isCorrect);
            const verdict = !hasAnswer ? "Unanswered" : !completed ? "Saved response"
              : answer?.marksAwarded == null ? "Awaiting grading"
              : answer.isCorrect === true ? "Correct" : answer.isCorrect === false ? "Incorrect" : "Graded";
            const color = completed && hasAnswer && answer?.isCorrect === true
              ? "border-green-300 text-green-800 dark:border-green-800 dark:text-green-300"
              : completed && hasAnswer && answer?.isCorrect === false
                ? "border-rose-300 text-rose-800 dark:border-rose-800 dark:text-rose-300" : "";
            return <section key={question.id} aria-label={`Question ${index + 1}`} className="min-w-0 rounded-md border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-medium">Question {index + 1} <span className="text-muted-foreground">/ {item.marks ?? question.defaultMarks} marks</span></h4>
                <Badge variant="outline" className={color}>{verdict}</Badge>
              </div>
              <MathText value={question.questionText} className="max-w-full break-words font-medium" />
              {question.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={question.imageUrl} alt={`Diagram for question ${index + 1}`} className="mt-3 max-h-80 max-w-full object-contain" />
              )}
              <div className="mt-4 grid min-w-0 gap-5 border-t pt-4 md:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Student answer</p>
                  <MathText value={selectedText(answer?.selectedAnswer || null, question)} className="max-w-full whitespace-pre-wrap break-words text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Answer key</p>
                  {question.questionType === "NUMERICAL" || !question.options.length
                    ? <p className="text-sm">Manual grading required</p>
                    : correctOptions.length
                      ? correctOptions.map(option => <MathText key={option.id} value={option.optionText} className="mr-2 max-w-full break-words text-sm" />)
                      : <p className="text-sm">Not marked</p>}
                </div>
              </div>
              {completed && answer?.marksAwarded != null && <p className="mt-4 text-sm">Marks awarded: {answer.marksAwarded}</p>}
              {question.explanation && <div className="mt-4 border-t pt-3">
                <p className="mb-2 text-xs text-muted-foreground">Explanation</p>
                <MathText value={question.explanation} className="max-w-full break-words text-sm" />
              </div>}
            </section>;
          })}
          {!questions.length && <p className="text-sm text-muted-foreground">No questions are available for this contest.</p>}
        </div>
      </>}
    </div>
  );
}
