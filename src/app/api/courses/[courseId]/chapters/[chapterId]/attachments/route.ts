import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const { url } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the user owns the course
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create the attachment and associate it with the specified chapter
    const attachment = await db.attachment.create({
      data: {
        url,
        name: url.split("/").pop(), // Extract the file name from the URL
        courseId: params.courseId,
        chapterId: params.chapterId, // Add chapter ID to associate with the chapter
      },
    });

    return new NextResponse(JSON.stringify(attachment), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("COURSE_ATTACHMENT_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
