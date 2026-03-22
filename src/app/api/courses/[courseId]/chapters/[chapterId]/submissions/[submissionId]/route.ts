import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; submissionId: string } }
) {
  try {
    const { userId } = auth();
    const { annotatedImages, status, feedback } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId
      }
    });

    if (!courseOwner) {
       return new NextResponse("Unauthorized", { status: 401 });
    }

    const submission = await db.chapterSubmission.update({
      where: {
        id: params.submissionId,
        chapterId: params.chapterId
      },
      data: {
        annotatedImages,
        status,
        feedback,
      }
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.log("[CHAPTER_SUBMISSION_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
