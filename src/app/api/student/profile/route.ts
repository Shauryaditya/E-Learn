
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const profile = await db.studentProfile.upsert({
      where: {
        userId,
      },
      update: {
        ...values,
      },
      create: {
        userId,
        ...values,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.log("[STUDENT_PROFILE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
