import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { db } from "@/lib/db";
import { AttemptError, attemptInputSchema, writeContestAttempt } from "@/lib/contest-attempts";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { contestId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const attempt = await db.contestAttempt.findUnique({
      where: { userId_contestId: { userId, contestId: params.contestId } },
      select: {
        status: true, updatedAt: true, expiresAt: true,
        registration: { select: { status: true } },
        answers: { select: { questionId: true, selectedAnswer: true } },
      },
    });
    if (!attempt) return new NextResponse("Attempt not found", { status: 404 });
    if (attempt.registration?.status !== "REGISTERED") return new NextResponse("Registration is not active", { status: 403 });
    return NextResponse.json({
      status: attempt.status,
      version: attempt.updatedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      answers: attempt.answers,
      serverTime: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[CONTEST_ANSWERS_GET]", error);
    return NextResponse.json({ message: "Could not recover your saved answers. Please retry." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { contestId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const input = attemptInputSchema.parse(await req.json());
    const result = await writeContestAttempt(db, userId, params.contestId, input, "save");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AttemptError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid answers." }, { status: 400 });
    }
    console.error("[CONTEST_ANSWERS_PUT]", error);
    return NextResponse.json({ message: "Answers could not be saved. Retrying when connected." }, { status: 500 });
  }
}
