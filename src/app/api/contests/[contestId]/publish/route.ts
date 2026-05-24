import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.findUnique({
      where: { id: params.contestId },
      include: { questions: true },
    });

    if (!contest || contest.userId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (
      !contest.title ||
      !contest.startsAt ||
      !contest.durationMinutes ||
      contest.questions.length === 0
    ) {
      return new NextResponse("Invalid contest data", { status: 400 });
    }

    const published = await db.contest.update({
      where: { id: params.contestId },
      data: { isPublished: true },
    });

    return NextResponse.json(published);
  } catch (error) {
    console.log("[CONTEST_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
