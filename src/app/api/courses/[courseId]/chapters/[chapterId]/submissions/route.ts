import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const { images } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapterOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
      }
    });

    if (!chapterOwner) {
       return new NextResponse("Course Not found", { status: 404 });
    }

    const submission = await db.chapterSubmission.create({
      data: {
        userId,
        chapterId: params.chapterId,
        images,
        annotatedImages: [],
      }
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.log("[CHAPTER_SUBMISSION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
