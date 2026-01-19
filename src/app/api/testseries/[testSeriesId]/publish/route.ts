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

    // Fetch by ID, then verify ownership (safer than findUnique with multiple fields)
    const testSeries = await db.testSeries.findUnique({
      where: { id: params.testSeriesId },
      include: {
        testChapters: {
          include: {
            tests: true,
          },
        },
      },
    });

    if (!testSeries || testSeries.userId !== userId) {
      return new NextResponse("Test series not found", { status: 404 });
    }

    // Validation similar to your course flow
    const hasPublishedChapter = testSeries.testChapters.some((ch) => ch.isPublished);

    // Optional: require at least one published test inside any chapter
    const hasPublishedTest =
      testSeries.testChapters.some((ch) => ch.tests?.some((t) => t.isPublished)) || false;

    // Require the core fields before publishing.
    // (description is optional in your schema; keep or remove from this check based on your rules)
    if (
      !testSeries.title ||
      !testSeries.description || // remove this line if description shouldn't be mandatory to publish
      !testSeries.imageUrl ||
      !testSeries.categoryId ||
      !hasPublishedChapter
      // || !hasPublishedTest   // uncomment if you want at least one published test
    ) {
      return new NextResponse("Invalid test series data", { status: 401 });
    }

    const published = await db.testSeries.update({
      where: { id: params.testSeriesId },
      data: { isPublished: true },
    });

    return NextResponse.json(published);
  } catch (error) {
    console.log("[TEST_SERIES_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
