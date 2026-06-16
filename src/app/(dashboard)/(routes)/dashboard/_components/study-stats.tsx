import { BookOpenCheck, CalendarDays, Clock3, Flame } from "lucide-react";

import { type StudyStats } from "@/actions/get-study-stats";
import { cn } from "@/lib/utils";

type StudyStatsProps = {
  stats: StudyStats;
};

const formatStudyTime = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const getUtcDay = (date = new Date()) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const getContributionDays = (stats: StudyStats) => {
  const today = getUtcDay();
  const start = addDays(today, -(52 * 7 + today.getUTCDay()));
  const activityByDate = new Map(
    stats.activityDays.map((activity) => [activity.date, activity.secondsStudied])
  );

  return Array.from({ length: 53 * 7 }, (_, index) => {
    const date = addDays(start, index);
    const dateKey = toDateKey(date);
    const secondsStudied = activityByDate.get(dateKey) ?? 0;

    return {
      date,
      dateKey,
      secondsStudied,
      isFuture: date > today,
    };
  });
};

const getActivityLevel = (secondsStudied: number) => {
  const minutes = Math.floor(secondsStudied / 60);

  if (minutes >= 120) return 4;
  if (minutes >= 60) return 3;
  if (minutes >= 20) return 2;
  if (minutes > 0) return 1;
  return 0;
};

const levelClass = {
  0: "bg-slate-200 dark:bg-slate-800",
  1: "bg-emerald-200 dark:bg-emerald-900",
  2: "bg-emerald-300 dark:bg-emerald-700",
  3: "bg-emerald-500 dark:bg-emerald-500",
  4: "bg-emerald-700 dark:bg-emerald-300",
};

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
const dayFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const StudyStatsSection = ({ stats }: StudyStatsProps) => {
  const contributionDays = getContributionDays(stats);
  const contributionWeeks = Array.from({ length: 53 }, (_, weekIndex) =>
    contributionDays.slice(weekIndex * 7, weekIndex * 7 + 7)
  );
  const activeDaysThisYear = contributionDays.filter(
    (day) => !day.isFuture && day.secondsStudied > 0
  ).length;
  const monthLabels = contributionWeeks.map((week, weekIndex) => {
    const firstDay = week[0];
    const previousWeek = contributionWeeks[weekIndex - 1];
    const previousMonth = previousWeek?.[0]?.date.getUTCMonth();
    const currentMonth = firstDay.date.getUTCMonth();

    return weekIndex === 0 || currentMonth !== previousMonth
      ? monthFormatter.format(firstDay.date)
      : "";
  });

  const items = [
    {
      label: "Current Streak",
      value: `${stats.currentStreak} ${stats.currentStreak === 1 ? "day" : "days"}`,
      detail: "Keep showing up daily",
      icon: Flame,
      accent: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    },
    {
      label: "Days Logged In",
      value: stats.daysLoggedIn.toString(),
      detail: "Total active study days",
      icon: CalendarDays,
      accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Study Time",
      value: formatStudyTime(stats.totalStudySeconds),
      detail: `${formatStudyTime(stats.todayStudySeconds)} today`,
      icon: Clock3,
      accent: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Chapters Done",
      value: stats.chaptersDone.toString(),
      detail: "Marked as completed",
      icon: BookOpenCheck,
      accent: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white md:text-2xl">
          Study Streak
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your login consistency, study time, and completed chapters
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                    {item.value}
                  </p>
                </div>
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", item.accent)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">
              {activeDaysThisYear} active {activeDaysThisYear === 1 ? "day" : "days"} in the past one year
            </h3>
            <span className="rounded-full border border-slate-200 px-1.5 text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
              i
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Total active days: <strong className="text-slate-800 dark:text-slate-200">{stats.daysLoggedIn}</strong></span>
            <span>Max streak: <strong className="text-slate-800 dark:text-slate-200">{stats.maxStreak}</strong></span>
            <span>Current: <strong className="text-slate-800 dark:text-slate-200">{stats.currentStreak}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[850px]">
            <div className="mb-2 ml-7 grid grid-flow-col grid-rows-1 gap-1 text-xs text-slate-500 dark:text-slate-400">
              {monthLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="h-4 w-3">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="grid grid-rows-7 gap-1 pt-0.5 text-xs leading-3 text-slate-500 dark:text-slate-400">
                <span className="h-3" />
                <span className="h-3">Mon</span>
                <span className="h-3" />
                <span className="h-3">Wed</span>
                <span className="h-3" />
                <span className="h-3">Fri</span>
                <span className="h-3" />
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {contributionWeeks.flatMap((week) =>
                  week.map((day) => {
                    const level = day.isFuture ? 0 : getActivityLevel(day.secondsStudied);
                    const label = day.isFuture
                      ? `${dayFormatter.format(day.date)}`
                      : `${formatStudyTime(day.secondsStudied)} studied on ${dayFormatter.format(day.date)}`;

                    return (
                      <span
                        key={day.dateKey}
                        title={label}
                        aria-label={label}
                        className={cn(
                          "h-3 w-3 rounded-[3px] ring-1 ring-slate-950/5 dark:ring-white/10",
                          levelClass[level as keyof typeof levelClass],
                          day.isFuture && "opacity-40"
                        )}
                      />
                    );
                  })
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={cn("h-3 w-3 rounded-[3px]", levelClass[level as keyof typeof levelClass])}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
