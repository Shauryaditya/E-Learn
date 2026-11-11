import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveStudentUserId } from "@/lib/access-grant";
import { db } from "@/lib/db";

const assignmentSchema = z.object({
  studentIdentifier: z.string().trim().min(1).max(254),
  testChapterId: z.string().uuid(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  instructions: z.string().trim().max(500).optional().default(""),
});

export async function POST(
  request: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const input = assignmentSchema.parse(await request.json());
    const testSeries = await db.testSeries.findFirst({
      where: { id: params.testSeriesId, userId },
      select: {
        id: true,
        title: true,
        testChapters: {
          where: { id: input.testChapterId, isPublished: true },
          select: { id: true, title: true },
        },
      },
    });
    const chapter = testSeries?.testChapters[0];
    if (!testSeries || !chapter) {
      return new NextResponse("Published practice chapter not found", { status: 404 });
    }

    const studentId = await resolveStudentUserId(input.studentIdentifier);
    if (!studentId) return new NextResponse("Student account not found", { status: 404 });
    if (studentId === userId) return new NextResponse("You cannot assign work to yourself", { status: 400 });

    const dueDate = new Date(`${input.dueDate}T12:00:00.000Z`);
    if (dueDate < new Date()) return new NextResponse("Due date must be in the future", { status: 400 });

    const [, goal] = await db.$transaction([
      db.testSeriesPurchase.upsert({
        where: { userId_testSeriesId: { userId: studentId, testSeriesId: testSeries.id } },
        update: {},
        create: { userId: studentId, testSeriesId: testSeries.id },
      }),
      db.goal.create({
        data: {
          title: `Complete ${chapter.title}`,
          description: input.instructions || `Assigned from ${testSeries.title}`,
          dueDate,
          studentId,
          teacherId: userId,
          testSeriesId: testSeries.id,
          href: `/testseries/${testSeries.id}/testChapter/${chapter.id}`,
        },
      }),
    ]);

    return NextResponse.json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Check assignment details" }, { status: 400 });
    }
    console.error("[TEST_SERIES_ASSIGN]", error);
    return new NextResponse("Could not assign this practice set", { status: 500 });
  }
}
