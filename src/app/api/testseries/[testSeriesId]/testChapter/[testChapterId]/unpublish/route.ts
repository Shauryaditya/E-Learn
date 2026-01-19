// app/api/testseries/[testSeriesId]/chapters/[testChapterId]/unpublish/route.ts

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

    const unpublishedChapter = await db.testChapter.update({
      where: {
        id: params.testChapterId,
        testSeriesId: params.testSeriesId,
      },
      data: {
        isPublished: false,
      }
    });

    const publishedChaptersInTestSeries = await db.testChapter.findMany({
      where: {
        testSeriesId: params.testSeriesId,
        isPublished: true,
      }
    });

    if (!publishedChaptersInTestSeries.length) {
      await db.testSeries.update({
        where: {
          id: params.testSeriesId,
        },
        data: {
          isPublished: false,
        }
      });
    }

    return NextResponse.json(unpublishedChapter);
  } catch (error) {
    console.log("[CHAPTER_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}