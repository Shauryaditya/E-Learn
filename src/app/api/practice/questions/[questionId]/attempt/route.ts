import { auth } from "@clerk/nextjs";
import { PracticeAttemptStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const attemptSchema = z.object({
  status: z.nativeEnum(PracticeAttemptStatus),
});

export async function POST(req: Request, { params }: { params: { questionId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const input = attemptSchema.safeParse(await req.json());
  if (!input.success) return new NextResponse("Invalid practice outcome", { status: 400 });

  const question = await db.resourceQuestion.findFirst({
    where: { id: params.questionId, isPublished: true },
    select: { id: true },
  });
  if (!question) return new NextResponse("Question not found", { status: 404 });

  const attempt = await db.practiceQuestionAttempt.upsert({
    where: { userId_questionId: { userId, questionId: question.id } },
    create: { userId, questionId: question.id, status: input.data.status },
    update: { status: input.data.status },
    select: { questionId: true, status: true, updatedAt: true },
  });

  return NextResponse.json(attempt);
}
