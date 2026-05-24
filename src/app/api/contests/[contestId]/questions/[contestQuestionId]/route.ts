import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { contestId: string; contestQuestionId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.findUnique({
      where: { id: params.contestId },
      select: { userId: true },
    });

    if (!contest || contest.userId !== userId) {
      return new NextResponse("Contest not found", { status: 404 });
    }

    const deleted = await db.contestQuestion.delete({
      where: {
        id: params.contestQuestionId,
        contestId: params.contestId,
      },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    console.log("[CONTEST_QUESTION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
