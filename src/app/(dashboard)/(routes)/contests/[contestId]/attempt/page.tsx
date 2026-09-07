import { auth } from "@clerk/nextjs";
import { ContestAttemptStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { formatContestDateTime } from "@/lib/contest-time";
import { db } from "@/lib/db";
import { ContestAttemptForm } from "./_components/contest-attempt-form";
import { StartContestButton } from "./_components/start-contest-button";

type PageProps = {
  params: { contestId: string };
};

const ContestAttemptPage = async ({ params }: PageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const contest = await db.contest.findUnique({
    where: {
      id: params.contestId,
      isPublished: true,
    },
    include: {
      registrations: {
        where: {
          userId,
          status: "REGISTERED",
        },
      },
      attempts: {
        where: { userId },
        include: {
          answers: true,
        },
      },
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              options: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!contest) {
    return redirect("/contests");
  }

  if (contest.registrations.length === 0) {
    return redirect("/contests");
  }

  const now = new Date();
  const endsAt = new Date(contest.startsAt.getTime() + contest.durationMinutes * 60 * 1000);
  const attempt = contest.attempts[0];

  if (now < contest.startsAt) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-md border border-border bg-card p-6">
          <Badge className="border-blue-300/30 bg-blue-300/10 text-blue-800 dark:text-blue-100">
            Registered
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">{contest.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The contest starts on {formatContestDateTime(contest.startsAt)}.
          </p>
        </div>
      </div>
    );
  }

  if (now >= endsAt && !attempt) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-md border border-border bg-card p-6">
          <Badge className="border-slate-300/20 bg-muted text-muted-foreground">
            Ended
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">{contest.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This contest ended on {formatContestDateTime(endsAt)}.
          </p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-md border border-border bg-card p-6">
          <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-800 dark:text-emerald-100">
            Live
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">{contest.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Once you start, do not switch tabs or leave the contest window.
          </p>
          <div className="mt-6">
            <StartContestButton contestId={contest.id} />
          </div>
        </div>
      </div>
    );
  }

  if (attempt.status !== ContestAttemptStatus.IN_PROGRESS) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-md border border-border bg-card p-6">
          <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-800 dark:text-emerald-100">
            Submitted
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">{contest.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your attempt has been submitted.
          </p>
          {now >= endsAt && attempt.score !== null && attempt.totalMarks !== null && (
            <p className="mt-4 text-lg font-semibold text-foreground">
              {attempt.answers.some(answer => answer.marksAwarded === null) ? "Provisional score" : "Score"}: {attempt.score} / {attempt.totalMarks}
            </p>
          )}
          {attempt.answers.some(answer => answer.marksAwarded === null) && (
            <p className="mt-2 text-sm text-muted-foreground">Some answers are awaiting grading.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ContestAttemptForm
      attemptId={attempt.id}
      contestId={contest.id}
      expiresAt={attempt.expiresAt.toISOString()}
      questions={contest.questions.map(item => ({
        id: item.id,
        marks: item.marks,
        question: {
          id: item.question.id,
          questionText: item.question.questionText,
          questionType: item.question.questionType,
          defaultMarks: item.question.defaultMarks,
          imageUrl: item.question.imageUrl,
          options: item.question.options.map(option => ({
            id: option.id, optionText: option.optionText, position: option.position,
          })),
        },
      }))}
      title={contest.title}
    />
  );
};

export default ContestAttemptPage;
