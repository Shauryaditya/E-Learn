import { auth } from "@clerk/nextjs";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileQuestion,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { ContestRegisterButton } from "../_components/contest-register-button";

type PageProps = {
  params: { contestId: string };
};

const formatDate = (date: Date) =>
  date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getContestEndsAt = (startsAt: Date, durationMinutes: number) =>
  new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

const ContestDetailPage = async ({ params }: PageProps) => {
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
      category: true,
      questions: {
        select: { id: true },
      },
      registrations: {
        select: {
          id: true,
          userId: true,
        },
      },
      attempts: {
        where: { userId },
        select: {
          id: true,
          status: true,
          score: true,
          totalMarks: true,
          autoSubmitted: true,
        },
      },
    },
  });

  if (!contest) {
    return redirect("/contests");
  }

  const now = new Date();
  const endsAt = getContestEndsAt(contest.startsAt, contest.durationMinutes);
  const registered = contest.registrations.some((registration) => registration.userId === userId);
  const registrationClosed = !!contest.registrationClosesAt && now > contest.registrationClosesAt;
  const canStart = registered && now >= contest.startsAt && now < endsAt;
  const hasEnded = now >= endsAt;
  const attempt = contest.attempts[0];
  const submitted = attempt && attempt.status !== "IN_PROGRESS";

  return (
    <div className="min-h-screen bg-[#0b1326] text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          href="/contests"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contests
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-blue-300/30 bg-blue-300/10 text-blue-100">
                {contest.category?.name || "General Contest"}
              </Badge>
              {registered && (
                <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Registered
                </Badge>
              )}
              {canStart && (
                <Badge className="border-rose-300/30 bg-rose-300/10 text-rose-100">
                  Live now
                </Badge>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              {contest.title}
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              {contest.description ||
                "Review the contest details, register before the deadline, and enter the proctored attempt window when the contest goes live."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                <CalendarDays className="h-5 w-5 text-blue-200" />
                <p className="mt-3 text-xs font-semibold uppercase text-slate-400">
                  Starts
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {formatDate(contest.startsAt)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                <Clock className="h-5 w-5 text-blue-200" />
                <p className="mt-3 text-xs font-semibold uppercase text-slate-400">
                  Duration
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {contest.durationMinutes} minutes
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                <FileQuestion className="h-5 w-5 text-blue-200" />
                <p className="mt-3 text-xs font-semibold uppercase text-slate-400">
                  Questions
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {contest.questions.length}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                <Users className="h-5 w-5 text-blue-200" />
                <p className="mt-3 text-xs font-semibold uppercase text-slate-400">
                  Registered
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {contest.registrations.length}
                  {contest.maxParticipants ? ` / ${contest.maxParticipants}` : ""}
                </p>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-md border border-white/10 bg-white/[0.04] p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-md border border-blue-300/30 bg-blue-300/10 text-blue-100">
              <Trophy className="h-7 w-7" />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Entry
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {contest.price ? formatPrice(contest.price) : "Free"}
              </p>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-300">
              {contest.registrationOpensAt && (
                <p>Registration opens: {formatDate(contest.registrationOpensAt)}</p>
              )}
              {contest.registrationClosesAt && (
                <p>Registration closes: {formatDate(contest.registrationClosesAt)}</p>
              )}
              <p>Contest ends: {formatDate(endsAt)}</p>
            </div>

            <div className="mt-6">
              {submitted ? (
                <div className="rounded-md border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-50">
                  <p className="font-medium">Attempt submitted</p>
                  {attempt.score !== null && attempt.totalMarks !== null && (
                    <p className="mt-1">
                      Score: {attempt.score} / {attempt.totalMarks}
                    </p>
                  )}
                  {attempt.autoSubmitted && (
                    <p className="mt-1 text-xs">Auto-submitted by proctoring rules.</p>
                  )}
                </div>
              ) : canStart ? (
                <Button asChild className="w-full bg-blue-300 text-blue-950 hover:bg-blue-200">
                  <Link href={`/contests/${contest.id}/attempt`}>Start contest</Link>
                </Button>
              ) : registered ? (
                <div className="rounded-md border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-50">
                  <p className="font-medium">You are registered</p>
                  <p className="mt-1 text-xs">
                    Start button will appear when the contest opens on {formatDate(contest.startsAt)}.
                  </p>
                </div>
              ) : (
                <ContestRegisterButton
                  contestId={contest.id}
                  isRegistered={registered}
                  registrationClosed={registrationClosed || hasEnded}
                />
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-md border border-amber-300/30 bg-amber-300/10 p-5 text-amber-50">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold">Contest rules</h2>
              <div className="mt-3 grid gap-2 text-sm leading-6">
                <p>Stay on the contest page after starting the attempt.</p>
                <p>Tab switching, minimizing the browser, and opening developer tools are counted as warnings.</p>
                <p>The attempt auto-submits after repeated warnings or when the timer ends.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContestDetailPage;
