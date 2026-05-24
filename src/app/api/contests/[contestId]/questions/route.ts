import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = auth();
    const { questionId, marks } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!questionId) {
      return new NextResponse("Question is required", { status: 400 });
    }

    const contest = await db.contest.findUnique({
      where: { id: params.contestId },
      include: { questions: true },
    });

    if (!contest || contest.userId !== userId) {
      return new NextResponse("Contest not found", { status: 404 });
    }

    const question = await db.questionBank.findUnique({
      where: { id: questionId },
      select: { id: true, userId: true },
    });

    if (!question || question.userId !== userId) {
      return new NextResponse("Question not found", { status: 404 });
    }

    const contestQuestion = await db.contestQuestion.create({
      data: {
        contestId: params.contestId,
        questionId,
        marks: marks ? Number(marks) : null,
        position: contest.questions.length + 1,
      },
    });

    return NextResponse.json(contestQuestion);
  } catch (error) {
    console.log("[CONTEST_QUESTIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
