import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getUtcDay, recordStudyActivity } from "@/lib/study-activity";

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const getCurrentStreak = (dates: Date[]) => {
  const activityDays = new Set(dates.map(toDateKey));
  let cursor = getUtcDay();
  let streak = 0;

  while (activityDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const secondsStudied = Number(body?.secondsStudied ?? 0);
    const activity = await recordStudyActivity(userId, secondsStudied);
    const activities = await db.studyActivity.findMany({
      where: {
        userId,
      },
      select: {
        date: true,
      },
    });

    return NextResponse.json({
      activity,
      date: toDateKey(activity.date),
      currentStreak: getCurrentStreak(activities.map((item) => item.date)),
    });
  } catch (error) {
    console.log("[STUDY_ACTIVITY_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
