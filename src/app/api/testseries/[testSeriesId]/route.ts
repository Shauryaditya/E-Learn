// app/api/testseries/[testSeriesId]/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const testSeries = await db.testSeries.findUnique({
      where: {
        id: params.testSeriesId,
        userId: userId,
      },
      include: {
        testChapters: {
          include: {
            questions: true,
          }
        }
      }
    });

    if (!testSeries) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedTestSeries = await db.testSeries.delete({
      where: {
        id: params.testSeriesId,
      },
    });

    return NextResponse.json(deletedTestSeries);
  } catch (error) {
    console.log("[TEST_SERIES_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();
    const { testSeriesId } = params;
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const testSeries = await db.testSeries.update({
      where: {
        id: testSeriesId,
        userId
      },
      data: {
        ...values,
      }
    });

    return NextResponse.json(testSeries);
  } catch (error) {
    console.log("[TEST_SERIES_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}