import { auth } from "@clerk/nextjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

const questionSchema = z.object({
  questionText: z.string().trim().min(1),
  questionType: z.string().trim().min(1).default("SHORT_ANSWER"),
  marks: z.coerce.number().positive().default(1),
  chapterTitle: z.string().trim().min(1).default("Unclassified"),
  answer: z.string().trim().optional().default(""),
  solution: z.string().trim().optional().default(""),
  formula: z.string().trim().optional().default(""),
  sourcePage: z.coerce.number().int().positive().optional(),
  options: z.array(z.object({ optionText: z.string(), isCorrect: z.boolean() })).optional().default([]),
});

const payloadSchema = z.object({ questions: z.array(questionSchema).min(1), publish: z.boolean().default(true) });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unclassified";

export async function POST(req: Request, { params }: { params: { resourceId: string } }) {
  try {
    const { userId } = auth();
    if (!userId || !isTeacher(userId)) return new NextResponse("Unauthorized", { status: 401 });
    const parsed = payloadSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ message: "Review the question drafts", issues: parsed.error.flatten() }, { status: 400 });

    const resource = await db.resource.findUnique({ where: { id: params.resourceId } });
    if (!resource) return new NextResponse("Paper not found", { status: 404 });
    if (!resource.board || !resource.grade) return new NextResponse("Board and class are required before publishing questions", { status: 400 });

    const chapterIds = new Map<string, string>();
    for (const question of parsed.data.questions) {
      const slug = slugify(question.chapterTitle);
      if (chapterIds.has(slug)) continue;
      const chapter = await db.academicChapter.upsert({
        where: { board_grade_subject_slug: { board: resource.board, grade: resource.grade, subject: resource.subject, slug } },
        create: { board: resource.board, grade: resource.grade, subject: resource.subject, slug, title: question.chapterTitle },
        update: { title: question.chapterTitle },
      });
      chapterIds.set(slug, chapter.id);
    }

    const data: Prisma.ResourceQuestionCreateManyInput[] = parsed.data.questions.map((question, index) => ({
      resourceId: resource.id,
      chapterId: chapterIds.get(slugify(question.chapterTitle)),
      questionText: question.questionText,
      questionType: question.questionType,
      marks: question.marks,
      answer: question.answer || null,
      solution: question.solution || null,
      formula: question.formula || null,
      sourcePage: question.sourcePage || null,
      options: question.options as Prisma.InputJsonValue,
      position: index + 1,
      isPublished: parsed.data.publish,
    }));

    const result = await db.$transaction([
      db.resourceQuestion.deleteMany({ where: { resourceId: resource.id } }),
      db.resourceQuestion.createMany({ data }),
      db.resource.update({ where: { id: resource.id }, data: { isPublished: parsed.data.publish } }),
    ]);
    return NextResponse.json({ count: result[1].count, published: parsed.data.publish });
  } catch (error) {
    console.error("[RESOURCE_QUESTIONS_POST]", error);
    return new NextResponse("Could not publish paper questions", { status: 500 });
  }
}
