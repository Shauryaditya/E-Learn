import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { resolveStudentUserId } from "@/lib/access-grant";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
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

    const purchase = await db.purchase.upsert({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: studentId,
        courseId: course.id,
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.log("[COURSE_GRANT_ACCESS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
