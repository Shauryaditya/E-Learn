import { auth } from "@clerk/nextjs";
import { ContestAttemptStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ContestAttemptForm } from "./_components/contest-attempt-form";
import { StartContestButton } from "./_components/start-contest-button";

type PageProps = {
  params: { contestId: string };
};

const formatDate = (date: Date) =>
  date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-white/[0.04] p-6">
          <Badge className="border-blue-300/30 bg-blue-300/10 text-blue-100">
            Registered
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-white">{contest.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            The contest starts on {formatDate(contest.startsAt)}.
          </p>
        </div>
      </div>
    );
  }

  if (now >= endsAt && !attempt) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-white/[0.04] p-6">
          <Badge className="border-slate-300/20 bg-white/[0.06] text-slate-200">
            Ended
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-white">{contest.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            This contest ended on {formatDate(endsAt)}.
          </p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-white/[0.04] p-6">
          <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
            Live
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-white">{contest.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
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
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-white/[0.04] p-6">
          <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
            Submitted
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-white">{contest.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            Your attempt has been submitted.
          </p>
          {attempt.score !== null && attempt.totalMarks !== null && (
            <p className="mt-4 text-lg font-semibold text-white">
              Score: {attempt.score} / {attempt.totalMarks}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ContestAttemptForm
      contestId={contest.id}
      expiresAt={attempt.expiresAt.toISOString()}
      questions={contest.questions}
      title={contest.title}
    />
  );
};

export default ContestAttemptPage;
