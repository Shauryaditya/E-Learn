import type { Prisma, PrismaClient } from "@prisma/client";

export async function loadTeacherDashboard(database: Pick<PrismaClient, "course" | "testSeries" | "contest" | "contestAttempt">, userId: string, now = new Date()) {
  const pending: Prisma.ContestAttemptWhereInput = {
    status: { not: "IN_PROGRESS" },
    answers: { some: { marksAwarded: null } },
  };
  const [courses, testSeries, activeAttempts, pendingReviews, upcoming, reviewContests, recentCourses, recentTests] = await Promise.all([
    database.course.count({ where: { userId } }),
    database.testSeries.count({ where: { userId } }),
    database.contestAttempt.count({ where: { contest: { userId }, status: "IN_PROGRESS", expiresAt: { gt: now } } }),
    database.contestAttempt.count({ where: { ...pending, contest: { userId } } }),
    database.contest.findMany({
      where: { userId, isPublished: true, startsAt: { gte: now } },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }], take: 4,
      select: { id: true, title: true, startsAt: true, durationMinutes: true,
        _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    }),
    database.contest.findMany({
      where: { userId, attempts: { some: pending } },
      orderBy: [{ startsAt: "desc" }, { id: "desc" }], take: 4,
      select: { id: true, title: true, _count: { select: { attempts: { where: pending } } } },
    }),
    database.course.findMany({ where: { userId }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 4,
      select: { id: true, title: true, imageUrl: true, isPublished: true, updatedAt: true } }),
    database.testSeries.findMany({ where: { userId }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 4,
      select: { id: true, title: true, imageUrl: true, isPublished: true, updatedAt: true } }),
  ]);
  const recentContent = [
    ...recentCourses.map(course => ({ ...course, kind: "Course" as const, href: `/teacher/courses/${course.id}` })),
    ...recentTests.map(series => ({ ...series, kind: "Test series" as const, href: `/teacher/testseries/${series.id}` })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 4);
  return { courses, testSeries, activeAttempts, pendingReviews, upcoming, reviewContests, recentContent };
}
