import type { PrismaClient } from "@prisma/client";

export const analyticsViews = ["courses", "test-series", "contests"] as const;
export type AnalyticsView = typeof analyticsViews[number];

export function parseAnalyticsView(value?: string | string[]): AnalyticsView {
  return typeof value === "string" && analyticsViews.includes(value as AnalyticsView)
    ? value as AnalyticsView
    : "courses";
}

const percentage = (value: number, total: number) => total > 0 ? value / total * 100 : 0;

export async function loadCourseAnalytics(
  database: Pick<PrismaClient, "course" | "chapterSubmission">,
  userId: string,
) {
  const [courses, submissions, pendingReviews] = await Promise.all([
    database.course.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true, title: true, price: true, isPublished: true,
        _count: { select: { chapters: true, purchases: true } },
      },
    }),
    database.chapterSubmission.count({ where: { chapter: { course: { userId } } } }),
    database.chapterSubmission.count({ where: {
      chapter: { course: { userId } }, status: "SUBMITTED",
    } }),
  ]);
  const sales = courses.reduce((sum, course) => sum + course._count.purchases, 0);
  const salesValue = courses.reduce((sum, course) => sum + (course.price || 0) * course._count.purchases, 0);
  return {
    view: "courses" as const,
    metrics: [
      { label: "Published courses", value: courses.filter(course => course.isPublished).length, detail: `${courses.length} total` },
      { label: "Course enrollments", value: sales, detail: "Completed purchases" },
      { label: "Assignment submissions", value: submissions, detail: `${pendingReviews} awaiting review` },
      { label: "Sales value", value: salesValue, format: "currency" as const, detail: "Using current course prices" },
    ],
    rows: courses.map(course => ({
      id: course.id, name: course.title, href: `/teacher/courses/${course.id}`,
      status: course.isPublished ? "Published" : "Draft",
      primary: course._count.purchases,
      secondary: course._count.chapters,
      value: (course.price || 0) * course._count.purchases,
    })).sort((a, b) => b.primary - a.primary || a.name.localeCompare(b.name)),
    labels: { primary: "Enrollments", secondary: "Chapters", value: "Sales value" },
  };
}

export async function loadTestSeriesAnalytics(
  database: Pick<PrismaClient, "testSeries" | "test" | "testSubmission">,
  userId: string,
) {
  const [series, tests, descriptiveSubmissions, pendingReviews] = await Promise.all([
    database.testSeries.findMany({
      where: { userId }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true, title: true, price: true, isPublished: true,
        _count: { select: { testSeriesPurchase: true, testChapters: true } },
      },
    }),
    database.test.findMany({
      where: { testChapter: { testSeries: { userId } } },
      select: {
        id: true, testChapter: { select: { testSeriesId: true } },
        testAttempts: { select: { isCompleted: true, percentage: true } },
      },
    }),
    database.testSubmission.count({ where: { testChapter: { testSeries: { userId } } } }),
    database.testSubmission.count({ where: {
      testChapter: { testSeries: { userId } }, status: "SUBMITTED",
    } }),
  ]);
  const attemptsBySeries = new Map<string, { total: number; completed: number; percentages: number[] }>();
  for (const test of tests) {
    const current = attemptsBySeries.get(test.testChapter.testSeriesId) || { total: 0, completed: 0, percentages: [] };
    current.total += test.testAttempts.length;
    current.completed += test.testAttempts.filter(attempt => attempt.isCompleted).length;
    current.percentages.push(...test.testAttempts.flatMap(attempt => attempt.percentage == null ? [] : [attempt.percentage]));
    attemptsBySeries.set(test.testChapter.testSeriesId, current);
  }
  const attempts = Array.from(attemptsBySeries.values()).reduce((sum, item) => sum + item.total, 0);
  const completed = Array.from(attemptsBySeries.values()).reduce((sum, item) => sum + item.completed, 0);
  const percentages = Array.from(attemptsBySeries.values()).flatMap(item => item.percentages);
  return {
    view: "test-series" as const,
    metrics: [
      { label: "Published series", value: series.filter(item => item.isPublished).length, detail: `${series.length} total` },
      { label: "Test attempts", value: attempts, detail: `${completed} completed` },
      { label: "Completion rate", value: percentage(completed, attempts), format: "percentage" as const, detail: `${descriptiveSubmissions} descriptive submissions` },
      { label: "Average score", value: percentages.length ? percentages.reduce((sum, item) => sum + item, 0) / percentages.length : 0, format: "percentage" as const, detail: `${pendingReviews} awaiting review` },
    ],
    rows: series.map(item => {
      const activity = attemptsBySeries.get(item.id) || { total: 0, completed: 0, percentages: [] };
      return {
        id: item.id, name: item.title, href: `/teacher/testseries/${item.id}`,
        status: item.isPublished ? "Published" : "Draft",
        primary: activity.total,
        secondary: percentage(activity.completed, activity.total),
        value: activity.percentages.length ? activity.percentages.reduce((sum, score) => sum + score, 0) / activity.percentages.length : 0,
      };
    }).sort((a, b) => b.primary - a.primary || a.name.localeCompare(b.name)),
    labels: { primary: "Attempts", secondary: "Completion", value: "Average score" },
    percentageColumns: ["secondary", "value"] as string[],
  };
}

export async function loadContestAnalytics(
  database: Pick<PrismaClient, "contest" | "contestAttempt">,
  userId: string,
  now = new Date(),
) {
  const [contests, attempts] = await Promise.all([
    database.contest.findMany({
      where: { userId }, orderBy: [{ startsAt: "desc" }, { id: "desc" }],
      select: {
        id: true, title: true, isPublished: true, startsAt: true, durationMinutes: true,
        _count: { select: { registrations: { where: { status: "REGISTERED" } }, questions: true } },
      },
    }),
    database.contestAttempt.findMany({
      where: { contest: { userId } },
      select: { contestId: true, status: true, percentage: true, expiresAt: true,
        answers: { where: { marksAwarded: null }, select: { id: true }, take: 1 } },
    }),
  ]);
  const attemptsByContest = new Map<string, typeof attempts>();
  for (const attempt of attempts) attemptsByContest.set(attempt.contestId, [...(attemptsByContest.get(attempt.contestId) || []), attempt]);
  const completed = attempts.filter(attempt => attempt.status !== "IN_PROGRESS");
  const scores = completed.flatMap(attempt => attempt.percentage == null ? [] : [attempt.percentage]);
  const pending = completed.filter(attempt => attempt.answers.length > 0).length;
  const active = attempts.filter(attempt => attempt.status === "IN_PROGRESS" && attempt.expiresAt > now).length;
  const registrations = contests.reduce((sum, contest) => sum + contest._count.registrations, 0);
  return {
    view: "contests" as const,
    metrics: [
      { label: "Registrations", value: registrations, detail: `${contests.length} contests` },
      { label: "Started attempts", value: attempts.length, detail: `${active} active now` },
      { label: "Participation rate", value: percentage(attempts.length, registrations), format: "percentage" as const, detail: `${completed.length} submitted` },
      { label: "Average score", value: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0, format: "percentage" as const, detail: `${pending} awaiting grading` },
    ],
    rows: contests.map(contest => {
      const contestAttempts = attemptsByContest.get(contest.id) || [];
      const submitted = contestAttempts.filter(attempt => attempt.status !== "IN_PROGRESS");
      const contestScores = submitted.flatMap(attempt => attempt.percentage == null ? [] : [attempt.percentage]);
      return {
        id: contest.id, name: contest.title, href: `/teacher/contests/${contest.id}/submissions`,
        status: contest.isPublished ? "Published" : "Draft",
        primary: contest._count.registrations,
        secondary: percentage(contestAttempts.length, contest._count.registrations),
        value: contestScores.length ? contestScores.reduce((sum, score) => sum + score, 0) / contestScores.length : 0,
      };
    }).sort((a, b) => b.primary - a.primary || a.name.localeCompare(b.name)),
    labels: { primary: "Registrations", secondary: "Participation", value: "Average score" },
    percentageColumns: ["secondary", "value"] as string[],
  };
}
