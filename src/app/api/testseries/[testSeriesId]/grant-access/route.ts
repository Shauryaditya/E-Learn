import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { resolveStudentUserId } from "@/lib/access-grant";
import { db } from "@/lib/db";

export async function POST(
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
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!testSeries) {
      return new NextResponse("Test series not found", { status: 404 });
    }

    const { studentIdentifier } = await req.json();

    if (typeof studentIdentifier !== "string") {
      return new NextResponse("Enter a student email or Clerk user ID", { status: 400 });
    }

    const studentId = await resolveStudentUserId(studentIdentifier);

    if (!studentId) {
      return new NextResponse("Student account not found", { status: 404 });
    }

    if (studentId === userId) {
      return new NextResponse("You cannot grant access to yourself", { status: 400 });
    }

    const purchase = await db.testSeriesPurchase.upsert({
      where: {
        userId_testSeriesId: {
          userId: studentId,
          testSeriesId: testSeries.id,
        },
      },
      update: {},
      create: {
        userId: studentId,
        testSeriesId: testSeries.id,
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.log("[TEST_SERIES_GRANT_ACCESS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
