// app/api/testseries/[testSeriesId]/chapters/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();
    const { title } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const testSeriesOwner = await db.testSeries.findUnique({
      where: {
        id: params.testSeriesId,
        userId: userId,
      }
    });

    if (!testSeriesOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const lastChapter = await db.testChapter.findFirst({
      where: {
        testSeriesId: params.testSeriesId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapter = await db.testChapter.create({
      data: {
        title,
        testSeriesId: params.testSeriesId,
        position: newPosition,
      }
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[CHAPTERS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}