import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; attachmentId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the user is the owner of the course
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId, // Ensuring the user owns the course
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify that the attachment belongs to the specified chapter
    const attachment = await db.attachment.findFirst({
      where: {
        id: params.attachmentId,
        chapterId: params.chapterId,
        courseId: params.courseId, // Ensuring the attachment belongs to the specified course and chapter
      },
    });

    if (!attachment) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    // Delete the attachment
    await db.attachment.delete({
      where: {
        id: params.attachmentId,
      },
    });

    return NextResponse.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
