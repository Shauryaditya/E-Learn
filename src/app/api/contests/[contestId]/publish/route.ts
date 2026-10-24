import { auth } from "@clerk/nextjs";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { formatContestDateTime } from "@/lib/contest-time";
import { broadcastNotification } from "@/lib/notifications";

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

    if (!contest.isPublished) {
      try {
        await broadcastNotification({
          eventKey: `contest:${contest.id}:published`,
          type: NotificationType.CONTEST_PUBLISHED,
          title: "New contest announced",
          body: `${contest.title} starts ${formatContestDateTime(contest.startsAt)}. Register now.`,
          href: `/contests/${contest.id}`,
          publisherId: userId,
        });
      } catch (error) {
        console.error("[CONTEST_PUBLISH_NOTIFICATION]", error);
      }
    }

    return NextResponse.json(published);
  } catch (error) {
    console.log("[CONTEST_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
