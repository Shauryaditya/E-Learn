import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const { title, categoryId, startsAt, durationMinutes, price } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !startsAt || !durationMinutes) {
      return new NextResponse("Title, start time, and duration are required", {
        status: 400,
      });
    }

    const contest = await db.contest.create({
      data: {
        userId,
        title,
        categoryId: categoryId || null,
        price: price ? Number(price) : null,
        startsAt: new Date(startsAt),
        durationMinutes: Number(durationMinutes),
      },
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.log("[CONTESTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
