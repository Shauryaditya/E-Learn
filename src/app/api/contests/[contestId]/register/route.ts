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
          select: { id: true },
        },
      },
    });

    if (!contest) {
      return new NextResponse("Contest not found", { status: 404 });
    }

    const now = new Date();

    if (contest.registrationOpensAt && now < contest.registrationOpensAt) {
      return new NextResponse("Registration has not opened yet", { status: 400 });
    }

    if (contest.registrationClosesAt && now > contest.registrationClosesAt) {
      return new NextResponse("Registration is closed", { status: 400 });
    }

    if (
      contest.maxParticipants &&
      contest.registrations.length >= contest.maxParticipants
    ) {
      return new NextResponse("Contest is full", { status: 400 });
    }

    const registration = await db.contestRegistration.upsert({
      where: {
        userId_contestId: {
          userId,
          contestId: params.contestId,
        },
      },
      update: {
        status: "REGISTERED",
      },
      create: {
        userId,
        contestId: params.contestId,
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.log("[CONTEST_REGISTER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
