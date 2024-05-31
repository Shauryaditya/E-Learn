import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string, attachmentId: string } }
) {
  try {
    const { userId } = auth();
    const { title } = await req.json()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const lastChapter = await db.chapter.findFirst({
      where: {
        courseId: params.courseId, // Assuming attachment has a courseId field for the relationship
      },
      orderBy: {
        position: "desc"
      }
    });

    const newPosition = lastChapter ? lastChapter.position + 1 : 1; // Assuming position is an integer

    const chapter = await db.chapter.create({
        data: {
            title,
            courseId: params.courseId,
            position: newPosition,
        }
    })

  return NextResponse.json(chapter);
  } catch (error) {
    console.error("[CHAPTERS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
