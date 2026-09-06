import { ContestAttemptStatus, ContestRegistrationStatus, QuestionType } from "@prisma/client";
import { CheckCircle2, Clock, FileQuestion } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/math-text";
import { formatContestDateTime } from "@/lib/contest-time";
import { cn } from "@/lib/utils";

type ContestQuestionForReview = {
  position: number;
  marks: number | null;
  question: {
    id: string;
    questionText: string;
    questionType: QuestionType;
    defaultMarks: number;
    options: {
      id: string;
      optionText: string;
      isCorrect: boolean;
      position: number;
    }[];
  };
};

type ContestRegistrationForReview = {
  id: string;
  userId: string;
  status: ContestRegistrationStatus;
  createdAt: Date;
  attempt: {
    id: string;
    status: ContestAttemptStatus;
    score: number | null;
    totalMarks: number | null;
    percentage: number | null;
    startedAt: Date;
    submittedAt: Date | null;
    expiresAt: Date;
    autoSubmitted: boolean;
    answers: {
      questionId: string;
      selectedAnswer: string | null;
      isCorrect: boolean | null;
      marksAwarded: number | null;
    }[];
  } | null;
};

type StudentDetails = {
  id: string;
  name: string;
  email: string;
};

interface ContestAttemptsReviewProps {
  registrations: ContestRegistrationForReview[];
  questions: ContestQuestionForReview[];
  students: StudentDetails[];
}

const statusLabel = (attempt: ContestRegistrationForReview["attempt"]) => {
  if (!attempt) return "Not started";
  if (attempt.status === ContestAttemptStatus.IN_PROGRESS) return "In progress";
  if (attempt.status === ContestAttemptStatus.AUTO_SUBMITTED) return "Auto-submitted";
  if (attempt.status === ContestAttemptStatus.EVALUATED) return "Evaluated";
  return "Submitted";
};

const answerBadgeClass = (isCorrect: boolean | null, hasAnswer: boolean) => {
  if (!hasAnswer) return "border-slate-200 bg-slate-100 text-slate-700";
  if (isCorrect === true) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (isCorrect === false) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const getStudentLabel = (userId: string, studentsById: Map<string, StudentDetails>) => {
  const student = studentsById.get(userId);

  if (!student) {
    return {
      name: "Student",
      email: userId,
    };
  }

  return student;
};

const formatSelectedAnswer = (
  selectedAnswer: string | null,
  question: ContestQuestionForReview["question"]
) => {
  if (!selectedAnswer) return "No answer";

  if (question.questionType === QuestionType.NUMERICAL || question.options.length === 0) {
    return selectedAnswer;
  }

  const selectedIds = selectedAnswer
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const optionById = new Map(question.options.map((option) => [option.id, option]));
  const selectedOptions = selectedIds
    .map((id) => optionById.get(id)?.optionText)
    .filter(Boolean);

  return selectedOptions.length > 0 ? selectedOptions.join(", ") : selectedAnswer;
};

const formatCorrectAnswer = (question: ContestQuestionForReview["question"]) => {
  if (question.questionType === QuestionType.NUMERICAL || question.options.length === 0) {
    return "Manual review";
  }

  const correctOptions = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.optionText);

  return correctOptions.length > 0 ? correctOptions.join(", ") : "Not marked";
};

export const ContestAttemptsReview = ({
  registrations,
  questions,
  students,
}: ContestAttemptsReviewProps) => {
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const submittedCount = registrations.filter(
    (registration) =>
      registration.attempt &&
      registration.attempt.status !== ContestAttemptStatus.IN_PROGRESS
  ).length;
  const inProgressCount = registrations.filter(
    (registration) => registration.attempt?.status === ContestAttemptStatus.IN_PROGRESS
  ).length;

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-medium">Student responses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review registered students, attempt status, scores, and submitted answers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{registrations.length} registered</Badge>
          <Badge variant="secondary">{inProgressCount} in progress</Badge>
          <Badge variant="secondary">{submittedCount} submitted</Badge>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {registrations.map((registration) => {
          const student = getStudentLabel(registration.userId, studentsById);
          const attempt = registration.attempt;
          const answersByQuestionId = new Map(
            attempt?.answers.map((answer) => [answer.questionId, answer]) || []
          );

          return (
            <details
              key={registration.id}
              className="rounded-md border bg-slate-50 p-4 dark:bg-slate-900"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "border",
                        attempt
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      )}
                    >
                      {statusLabel(attempt)}
                    </Badge>
                    {attempt?.autoSubmitted && (
                      <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                        Proctor auto-submit
                      </Badge>
                    )}
                    {attempt && attempt.score !== null && attempt.totalMarks !== null && (
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        {attempt?.score} / {attempt?.totalMarks}
                      </Badge>
                    )}
                  </div>
                </div>
              </summary>

              <div className="mt-4 grid gap-3 border-t pt-4 text-sm">
                <div className="grid gap-2 text-muted-foreground sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Registered {formatContestDateTime(registration.createdAt)}
                  </div>
                  {attempt && (
                    <>
                      <div className="flex items-center gap-2">
                        <FileQuestion className="h-4 w-4" />
                        Started {formatContestDateTime(attempt.startedAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {attempt.submittedAt
                          ? `Submitted ${formatContestDateTime(attempt.submittedAt)}`
                          : `Expires ${formatContestDateTime(attempt.expiresAt)}`}
                      </div>
                    </>
                  )}
                </div>

                {!attempt ? (
                  <div className="rounded-md border border-dashed bg-background p-5 text-center text-muted-foreground">
                    This student has registered but has not started the contest yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((contestQuestion) => {
                      const question = contestQuestion.question;
                      const answer = answersByQuestionId.get(question.id);
                      const selectedText = formatSelectedAnswer(
                        answer?.selectedAnswer || null,
                        question
                      );
                      const hasAnswer = !!answer?.selectedAnswer;

                      return (
                        <div key={question.id} className="rounded-md border bg-background p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Question {contestQuestion.position} ·{" "}
                                {contestQuestion.marks ?? question.defaultMarks} marks
                              </p>
                              <div className="mt-1 font-medium">
                                <MathText value={question.questionText} />
                              </div>
                            </div>
                            <Badge
                              className={cn(
                                "w-fit border",
                                answerBadgeClass(answer?.isCorrect ?? null, hasAnswer)
                              )}
                            >
                              {hasAnswer
                                ? answer?.isCorrect === null
                                  ? "Manual review"
                                  : answer?.isCorrect
                                    ? "Correct"
                                    : "Incorrect"
                                : "Unanswered"}
                            </Badge>
                          </div>

                          <div className="mt-3 grid gap-2 rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Student answer
                              </p>
                              <div className="mt-1">
                                <MathText value={selectedText} />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Correct answer
                              </p>
                              <div className="mt-1">
                                <MathText value={formatCorrectAnswer(question)} />
                              </div>
                            </div>
                            {answer?.marksAwarded !== null && answer?.marksAwarded !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Marks awarded: {answer.marksAwarded}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </details>
          );
        })}

        {registrations.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No students have registered for this contest yet.
          </div>
        )}
      </div>
    </div>
  );
};
