// app/api/testseries/[testSeriesId]/chapters/[testChapterId]/publish/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { testSeriesId: string; testChapterId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const testSeriesOwner = await db.testSeries.findUnique({
      where: {
        id: params.testSeriesId,
        userId,
      }
    });

    if (!testSeriesOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const testChapter = await db.testChapter.findUnique({
      where: {
        id: params.testChapterId,
        testSeriesId: params.testSeriesId,
      }
    });

    if (!testChapter || !testChapter.title || !testChapter.description) {
      return new NextResponse("Missing required fields", { status: 401 });
    }

    const publishedChapter = await db.testChapter.update({
      where: {
        id: params.testChapterId,
        testSeriesId: params.testSeriesId,
      },
      data: {
        isPublished: true,
      }
    });

    return NextResponse.json(publishedChapter);
  } catch (error) {
    console.log("[CHAPTER_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}