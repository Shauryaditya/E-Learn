import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Clock,
  FlaskConical,
  FunctionSquare,
  Medal,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { ContestRegisterButton } from "./_components/contest-register-button";

type ContestWithMeta = Awaited<ReturnType<typeof getContests>>[number];

const getContests = async (userId: string) => {
  return db.contest.findMany({
    where: {
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
    },
    orderBy: {
      startsAt: "asc",
    },
  });
};

const formatDate = (date: Date) =>
  date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const isRegistered = (contest: ContestWithMeta, userId: string) =>
  contest.registrations.some((registration) => registration.userId === userId);

const registrationClosed = (contest: ContestWithMeta) => {
  const now = new Date();
  return !!contest.registrationClosesAt && now > contest.registrationClosesAt;
};

const getTimeUntil = (date: Date) => {
  const diff = date.getTime() - Date.now();

  if (diff <= 0) return "Live now";

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const contestIcon = (index: number) => {
  const icons = [FlaskConical, FunctionSquare, Medal];
  return icons[index % icons.length];
};

const ContestCard = ({
  contest,
  userId,
  index,
}: {
  contest: ContestWithMeta;
  userId: string;
  index: number;
}) => {
  const Icon = contestIcon(index);
  const registered = isRegistered(contest, userId);
  const closed = registrationClosed(contest);

  return (
    <article className="group flex h-full flex-col gap-5 rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-sm transition hover:border-blue-300/50 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
        <Badge className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
          {closed ? "Closed" : registered ? "Registered" : "Registration Open"}
        </Badge>
      </div>

      <div>
        <h3 className="line-clamp-2 text-xl font-semibold text-white">
          {contest.title}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {contest.category?.name || "General Contest"}
        </p>
        <p className="mt-3 text-2xl font-semibold text-blue-100">
          {contest.price ? formatPrice(contest.price) : "Free"}
        </p>
      </div>

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-200" />
          {formatDate(contest.startsAt)}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-200" />
          Duration: {contest.durationMinutes} mins
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-200" />
          {contest.registrations.length}
          {contest.maxParticipants ? ` / ${contest.maxParticipants}` : ""} registered
        </div>
      </div>

      <ContestRegisterButton
        contestId={contest.id}
        isRegistered={registered}
        registrationClosed={closed}
      />
    </article>
  );
};

const ContestsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const contests = await getContests(userId);
  const now = new Date();
  const upcoming = contests.filter((contest) => contest.startsAt >= now);
  const past = contests.filter((contest) => contest.startsAt < now).reverse();
  const featured = upcoming[0];

  return (
    <div className="min-h-screen bg-[#0b1326] text-slate-100">
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-6 shadow-sm md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-blue-300/15 to-transparent md:block" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_320px] md:items-center">
            <div className="space-y-5">
              <Badge className="border-blue-300/30 bg-blue-300/10 text-blue-100 hover:bg-blue-300/10">
                Featured Event
              </Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                  {featured?.title || "Weekly Academic Challenge"}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                  {featured?.description ||
                    "Compete in weekly timed contests, sharpen exam skills, and measure your performance against peers."}
                </p>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Starts In
                  </p>
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] px-5 py-3 text-2xl font-semibold text-blue-200">
                    {featured ? getTimeUntil(featured.startsAt) : "Coming soon"}
                  </div>
                </div>
                {featured && (
                  <div className="w-full sm:w-52">
                    <ContestRegisterButton
                      contestId={featured.id}
                      isRegistered={isRegistered(featured, userId)}
                      registrationClosed={registrationClosed(featured)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-slate-950/60">
              <div className="grid place-items-center gap-4 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-blue-300/30 bg-blue-300/10 text-blue-100">
                  <Trophy className="h-12 w-12" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Contest Arena</p>
                  <p className="text-xs text-slate-400">
                    {featured?.questions.length || 0} questions ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Upcoming Contests
              </h2>
              <p className="text-sm text-slate-400">
                Register before the contest window closes.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-blue-200" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((contest, index) => (
              <ContestCard
                key={contest.id}
                contest={contest}
                userId={userId}
                index={index}
              />
            ))}
          </div>

          {upcoming.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-400">
              No upcoming contests yet.
            </div>
          )}
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold text-white">Past Contests</h2>
          <div className="space-y-3">
            {past.slice(0, 6).map((contest) => (
              <div
                key={contest.id}
                className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.06] text-slate-300">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{contest.title}</p>
                    <p className="text-sm text-slate-400">
                      Completed {formatDate(contest.startsAt)} ·{" "}
                      {contest.registrations.length} participants
                    </p>
                  </div>
                </div>
                <Badge className="w-fit border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.06]">
                  Results soon
                </Badge>
              </div>
            ))}
            {past.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                Past contests will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContestsPage;
