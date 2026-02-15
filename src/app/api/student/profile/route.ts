
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const values = await req.json();

    console.log("[STUDENT_PROFILE_POST] Request values:", values);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Filter values to only allowed fields to prevent Prisma "Unknown argument" errors
    const { name, grade, board, subjects, targetExam } = values;

    const profile = await db.studentProfile.upsert({
      where: {
        userId,
      },
      update: {
        name,
        grade,
        board,
        subjects,
        targetExam
      },
      create: {
        userId,
        name,
        grade,
        board,
        subjects,
        targetExam
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[STUDENT_PROFILE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
