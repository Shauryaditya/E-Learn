import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const { title, categoryId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !categoryId) {
      return new NextResponse("Title and Category are required", { status: 400 });
    }

    const testseries = await db.testSeries.create({
      data: {
        userId,
        title,
        categoryId,
      }
    });

    return NextResponse.json(testseries);
  } catch (error) {
    console.log("[TESTSERIES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}