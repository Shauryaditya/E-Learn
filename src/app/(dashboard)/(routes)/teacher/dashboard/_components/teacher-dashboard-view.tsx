import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Notebook,
  Pencil,
  Trophy,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTEST_TIME_ZONE, formatContestDateTime } from "@/lib/contest-time";
import type { loadTeacherDashboard } from "@/lib/teacher-dashboard";
import { TeacherCreateMenu } from "./teacher-create-menu";

export function TeacherDashboardView({ data, now }: {
  data: Awaited<ReturnType<typeof loadTeacherDashboard>>;
  now: Date;
}) {
  const workspace = [
    { label: "Courses", value: data.courses, icon: BookOpen, href: "/teacher/courses" },
    { label: "Test series", value: data.testSeries, icon: Notebook, href: "/teacher/testseries" },
    { label: "Active attempts", value: data.activeAttempts, icon: Activity, href: "/teacher/contests" },
  ];
  const nextContest = data.upcoming[0];

  return (
    <div className="min-h-screen min-w-0 bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-sm text-muted-foreground">
              {now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: CONTEST_TIME_ZONE,
              })}
            </p>
            <h1 className="text-2xl font-semibold">Teaching workspace</h1>
          </div>
          <TeacherCreateMenu />
        </header>

        <section className="grid overflow-hidden rounded-md border bg-card lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div className="min-w-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Needs attention</p>
                <h2 className="mt-2 text-xl font-semibold">
                  {data.pendingReviews
                    ? `${data.pendingReviews} contest ${data.pendingReviews === 1 ? "submission" : "submissions"} to review`
                    : "Your review queue is clear"}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {data.pendingReviews
                    ? "Grade subjective answers to release complete and accurate scores."
                    : "New subjective submissions will appear here as students finish contests."}
                </p>
              </div>
              {data.pendingReviews ? (
                <Button asChild>
                  <Link href="#contest-reviews">Open review queue<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              ) : <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />}
            </div>

            <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded border bg-border">
              {workspace.map(item => (
                <Link key={item.label} href={item.href} className="group min-w-0 bg-background px-3 py-4 hover:bg-muted/40 sm:px-4">
                  <item.icon className="mb-3 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  <p className="text-xl font-semibold tabular-nums">{item.value}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t bg-cyan-50/70 p-5 dark:bg-cyan-950/20 lg:border-l lg:border-t-0 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase text-cyan-900/70 dark:text-cyan-200/70">Up next</p>
              <Trophy className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
            </div>
            {nextContest ? (
              <div className="mt-5">
                <Link href={`/teacher/contests/${nextContest.id}`} className="break-words text-lg font-semibold hover:underline">
                  {nextContest.title}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">{formatContestDateTime(nextContest.startsAt)}</p>
                <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{nextContest.durationMinutes} min</span>
                  <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{nextContest._count.registrations} registered</span>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-6 bg-background/70">
                  <Link href={`/teacher/contests/${nextContest.id}`}>Manage contest<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-muted-foreground">No published contest is scheduled.</p>
                <Button asChild variant="outline" size="sm" className="mt-5 bg-background/70">
                  <Link href="/teacher/create-contest">Schedule contest</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Calendar</p>
                <h2 className="mt-1 text-lg font-semibold">Upcoming contests</h2>
              </div>
              <Link href="/teacher/contests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                View all<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y border-y">
              {data.upcoming.map(contest => (
                <div key={contest.id} className="flex min-w-0 items-center gap-4 py-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center border-l-2 border-cyan-500 bg-muted/40">
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">
                      {contest.startsAt.toLocaleDateString("en-IN", { month: "short", timeZone: CONTEST_TIME_ZONE })}
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {contest.startsAt.toLocaleDateString("en-IN", { day: "2-digit", timeZone: CONTEST_TIME_ZONE })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/teacher/contests/${contest.id}`} className="break-words text-sm font-medium hover:underline">{contest.title}</Link>
                    <p className="mt-1 text-xs text-muted-foreground">{formatContestDateTime(contest.startsAt)} · {contest._count.registrations} registered</p>
                  </div>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/teacher/contests/${contest.id}`} aria-label={`Open ${contest.title}`}><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              ))}
              {!data.upcoming.length && (
                <div className="flex items-center gap-3 py-7 text-sm text-muted-foreground">
                  <CalendarDays className="h-5 w-5" />No upcoming published contests.
                </div>
              )}
            </div>
          </section>

          <section id="contest-reviews" className="min-w-0 scroll-mt-24">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Assessment</p>
                <h2 className="mt-1 text-lg font-semibold">Review queue</h2>
              </div>
              <Badge variant="outline">{data.pendingReviews} pending</Badge>
            </div>
            <div className="divide-y border-y">
              {data.reviewContests.map(contest => (
                <Link key={contest.id} href={`/teacher/contests/${contest.id}/submissions?status=needs_grading`}
                  className="flex min-w-0 items-center gap-3 py-4 hover:bg-muted/30">
                  <ClipboardCheck className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{contest.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{contest._count.attempts} awaiting grading</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ))}
              {!data.reviewContests.length && (
                <div className="flex items-center gap-3 py-7 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />Nothing waiting for review.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Content</p>
              <h2 className="mt-1 text-lg font-semibold">Recently edited</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/teacher/analytics" className="inline-flex items-center gap-1 hover:text-foreground"><BarChart3 className="h-4 w-4" />Analytics</Link>
              <Link href="/teacher/courses" className="hover:text-foreground">All content</Link>
            </div>
          </div>
          <div className="divide-y border-y">
            {data.recentContent.map(item => (
              <div key={item.href} className="flex min-w-0 items-center gap-3 py-4 sm:gap-4">
                <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : item.kind === "Course"
                    ? <BookOpen className="h-5 w-5 text-muted-foreground" />
                    : <Notebook className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={item.href} className="break-words text-sm font-medium hover:underline">{item.title}</Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.kind}</p>
                </div>
                <Badge variant="outline" className="shrink-0">{item.isPublished ? "Published" : "Draft"}</Badge>
                <Button asChild size="icon" variant="ghost" className="shrink-0">
                  <Link href={item.href} aria-label={`Edit ${item.title}`}><Pencil className="h-4 w-4" /></Link>
                </Button>
              </div>
            ))}
            {!data.recentContent.length && <p className="py-8 text-sm text-muted-foreground">No courses or test series yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
