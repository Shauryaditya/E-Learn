import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch by id and verify ownership
    const testSeries = await db.testSeries.findUnique({
      where: { id: params.testSeriesId },
      select: { id: true, userId: true },
    });

    if (!testSeries || testSeries.userId !== userId) {
      return new NextResponse("Test series not found", { status: 404 });
    }

    // Unpublish the test series
    const unpublished = await db.testSeries.update({
      where: { id: params.testSeriesId },
      data: { isPublished: false },
    });

    // OPTIONAL: also unpublish all chapters and tests under this series
    // await db.$transaction([
    //   db.testChapter.updateMany({
    //     where: { testSeriesId: params.testSeriesId },
    //     data: { isPublished: false },
    //   }),
    //   db.test.updateMany({
    //     where: { testChapter: { testSeriesId: params.testSeriesId } },
    //     data: { isPublished: false },
    //   }),
    // ]);

    return NextResponse.json(unpublished);
  } catch (error) {
    console.log("[TEST_SERIES_ID_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
