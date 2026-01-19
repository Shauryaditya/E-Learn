// app/api/testseries/[testSeriesId]/chapters/[testChapterId]/attachments/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { testSeriesId: string; testChapterId: string } }
) {
  try {
    const { userId } = auth();
    const { url } = await req.json();

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

    const attachment = await db.attachment.create({
      data: {
        url,
        name: url.split("/").pop() || "attachment",
        testChapterId: params.testChapterId,  
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.log("TEST_CHAPTER_ATTACHMENTS", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}