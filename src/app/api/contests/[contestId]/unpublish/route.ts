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

    const contest = await db.contest.update({
      where: {
        id: params.contestId,
        userId,
      },
      data: { isPublished: false },
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.log("[CONTEST_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
