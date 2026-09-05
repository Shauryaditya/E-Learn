import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.findUnique({
      where: {
        id: params.contestId,
        isPublished: true,
      },
      include: {
        registrations: {
          where: {
            userId,
            status: "REGISTERED",
          },
        },
        attempts: {
          where: { userId },
        },
        questions: {
          select: { id: true },
        },
      },
    });

    if (!contest) {
      return new NextResponse("Contest not found", { status: 404 });
    }

    if (contest.registrations.length === 0) {
      return new NextResponse("Register for the contest first", { status: 403 });
    }

    if (contest.questions.length === 0) {
      return new NextResponse("Contest has no questions yet", { status: 400 });
    }

    const now = new Date();
    const contestEndsAt = new Date(
      contest.startsAt.getTime() + contest.durationMinutes * 60 * 1000
    );

    if (now < contest.startsAt) {
      return new NextResponse("Contest has not started yet", { status: 400 });
    }

    if (now >= contestEndsAt) {
      return new NextResponse("Contest has ended", { status: 400 });
    }

    const existingAttempt = contest.attempts[0];

    if (existingAttempt) {
      return NextResponse.json(existingAttempt);
    }

    const attempt = await db.contestAttempt.create({
      data: {
        userId,
        contestId: params.contestId,
        registrationId: contest.registrations[0].id,
        expiresAt: contestEndsAt,
      },
    });

    return NextResponse.json(attempt);
  } catch (error) {
    console.log("[CONTEST_START]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
