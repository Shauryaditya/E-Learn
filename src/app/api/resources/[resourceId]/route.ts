import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveAcademicChapter } from "@/lib/academic-chapters";
import { normalizeBoard, normalizeGrade, normalizeSubject } from "@/lib/academic-taxonomy";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

const metadataSchema = z.object({
  title: z.string().trim().min(1).max(160),
  board: z.string().trim().min(1).max(80),
  grade: z.string().trim().min(1).max(40),
  subject: z.string().trim().min(1).max(80),
  schoolName: z.string().trim().max(160).optional().nullable(),
  examType: z.string().trim().max(80).optional().nullable(),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear()).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { resourceId: string } }) {
  try {
    const { userId } = auth();
    if (!userId || !isTeacher(userId)) return new NextResponse("Unauthorized", { status: 401 });
    const parsed = metadataSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ message: "Review the paper details", issues: parsed.error.flatten() }, { status: 400 });

    const resource = await db.resource.findUnique({
      where: { id: params.resourceId },
      include: { questions: { select: { id: true, chapter: { select: { title: true } } } } },
    });
    if (!resource) return new NextResponse("Paper not found", { status: 404 });

    const board = normalizeBoard(parsed.data.board);
    const grade = normalizeGrade(parsed.data.grade);
    const subject = normalizeSubject(parsed.data.subject);
    const chapterIds = new Map<string, string>();
    for (const question of resource.questions) {
      const title = question.chapter?.title || "Unclassified";
      if (chapterIds.has(title)) continue;
      const chapter = await resolveAcademicChapter({ board, grade, subject, title });
      chapterIds.set(title, chapter.id);
    }

    await db.$transaction([
      db.resource.update({ where: { id: resource.id }, data: { ...parsed.data, board, grade, subject, schoolName: parsed.data.schoolName || null, examType: parsed.data.examType || null } }),
      ...resource.questions.map((question) => db.resourceQuestion.update({ where: { id: question.id }, data: { chapterId: chapterIds.get(question.chapter?.title || "Unclassified") } })),
    ]);
    return NextResponse.json({ updated: true, questionCount: resource.questions.length });
  } catch (error) {
    console.error("[RESOURCE_METADATA_PATCH]", error);
    return new NextResponse("Could not update paper details", { status: 500 });
  }
}
