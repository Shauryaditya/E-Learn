// app/api/testseries/[testSeriesId]/chapters/[testChapterId]/attachments/[attachmentId]/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { testSeriesId: string; testChapterId: string; attachmentId: string } }
) {
  try {
    const { userId } = auth();

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

    const attachment = await db.attachment.delete({
      where: {
        id: params.attachmentId,
        chapterId: params.testChapterId,
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.log("TEST_CHAPTER_ATTACHMENT_ID", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}