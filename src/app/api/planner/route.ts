import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { attachLmsResources, carryRoadmapProgress, generateRoadmap, type PlannerResourceCandidate, type PlannerRoadmap } from "@/lib/study-planner";

const subjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  weeklyMinutes: z.number().int().min(30).max(1200),
  chapters: z.array(z.string().trim().min(1).max(160)).min(1).max(80),
});

const planSchema = z.object({
  grade: z.string().trim().min(1).max(40),
  board: z.string().trim().min(1).max(40).optional(),
  examName: z.string().trim().min(1).max(120),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid examination date"),
  subjects: z.array(subjectSchema).min(1).max(12),
});

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const plan = await db.studyPlan.findUnique({ where: { userId } });
  return NextResponse.json(plan);
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const input = planSchema.parse(await request.json());
    const existingPlan = await db.studyPlan.findUnique({ where: { userId }, select: { roadmap: true } });
    // Store a date-only value at midday UTC so it displays as the same calendar
    // day in India and other common time zones.
    const examDate = new Date(`${input.examDate}T12:00:00.000Z`);
    if (examDate <= new Date()) {
      return new NextResponse("The examination date must be in the future", { status: 400 });
    }

    const [courses, testSeries, paperChapters] = await Promise.all([
      db.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          category: { select: { name: true } },
          purchases: { where: { userId }, select: { id: true } },
          chapters: {
            where: { isPublished: true },
            select: {
              id: true,
              title: true,
              description: true,
              attachments: { select: { name: true } },
            },
            orderBy: { position: "asc" },
            take: 30,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 60,
      }),
      db.testSeries.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          category: { select: { name: true } },
          testSeriesPurchase: { where: { userId }, select: { id: true } },
          testChapters: {
            where: { isPublished: true },
            select: { id: true, title: true, description: true },
            orderBy: { position: "asc" },
            take: 30,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 60,
      }),
      db.academicChapter.findMany({
        where: { questions: { some: { isPublished: true } } },
        select: {
          id: true,
          board: true,
          grade: true,
          subject: true,
          title: true,
          slug: true,
          questions: { where: { isPublished: true }, select: { id: true }, take: 500 },
        },
        orderBy: [{ grade: "asc" }, { subject: "asc" }, { title: "asc" }],
        take: 300,
      }),
    ]);

    const plainText = (value?: string | null) => (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const candidates: PlannerResourceCandidate[] = [
      ...courses.flatMap((course) => course.chapters.map((chapter) => ({
        id: chapter.id,
        kind: "LEARNING_MATERIAL" as const,
        title: chapter.title,
        context: `${course.title} · Notes & assignment`,
        href: `/courses/${course.id}/chapters/${chapter.id}`,
        hasAccess: course.purchases.length > 0,
        searchText: [course.title, course.category?.name, plainText(course.description), chapter.title, plainText(chapter.description), ...chapter.attachments.map((attachment) => attachment.name)].filter(Boolean).join(" "),
      }))),
      ...testSeries.flatMap((series) => series.testChapters.map((chapter) => ({
        id: chapter.id,
        kind: "PRACTICE_SET" as const,
        title: chapter.title,
        context: `${series.title} · Practice test`,
        href: `/testseries/${series.id}/testChapter/${chapter.id}`,
        hasAccess: series.testSeriesPurchase.length > 0,
        searchText: [series.title, series.category?.name, plainText(series.description), chapter.title, plainText(chapter.description)].filter(Boolean).join(" "),
      }))),
      ...paperChapters.map((chapter) => ({
        id: chapter.id,
        kind: "PAPER_PRACTICE" as const,
        title: chapter.title,
        context: `${chapter.questions.length} questions from uploaded papers`,
        href: `/practice/questions?${new URLSearchParams({ board: chapter.board, grade: chapter.grade, subject: chapter.subject, chapter: chapter.slug }).toString()}`,
        hasAccess: true,
        searchText: [chapter.board, chapter.grade, chapter.subject, chapter.title, "previous year school board paper questions practice"].join(" "),
      })),
    ];

    const roadmap = carryRoadmapProgress(
      existingPlan?.roadmap as unknown as PlannerRoadmap | undefined,
      attachLmsResources(generateRoadmap(input), candidates, input.grade)
    );
    const weeklyMinutes = input.subjects.reduce((total, subject) => total + subject.weeklyMinutes, 0);
    const plan = await db.studyPlan.upsert({
      where: { userId },
      update: {
        ...input,
        examDate,
        weeklyMinutes,
        subjects: input.subjects as Prisma.InputJsonValue,
        roadmap: roadmap as unknown as Prisma.InputJsonValue,
        status: "ACTIVE",
      },
      create: {
        userId,
        ...input,
        examDate,
        weeklyMinutes,
        subjects: input.subjects as Prisma.InputJsonValue,
        roadmap: roadmap as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("[STUDY_PLANNER_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Invalid planner details" }, { status: 400 });
    }
    return new NextResponse("Unable to create your study plan", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    if (!body.roadmap || !Array.isArray(body.roadmap.weeks)) {
      return new NextResponse("Invalid roadmap", { status: 400 });
    }

    const plan = await db.studyPlan.update({
      where: { userId },
      data: { roadmap: body.roadmap as Prisma.InputJsonValue },
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[STUDY_PLANNER_PATCH]", error);
    return new NextResponse("Unable to update your roadmap", { status: 500 });
  }
}
