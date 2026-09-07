import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { db } from "@/lib/db";
import { AttemptError, attemptInputSchema, writeContestAttempt } from "@/lib/contest-attempts";

export async function POST(req: Request, { params }: { params: { contestId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const input = attemptInputSchema.parse(await req.json());
    const result = await writeContestAttempt(db, userId, params.contestId, input, "submit");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AttemptError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid answers. Reload the contest and try again." }, { status: 400 });
    }
    console.error("[CONTEST_SUBMIT]", error);
    return NextResponse.json({ message: "Could not submit. Your saved answers are retained; please retry." }, { status: 500 });
  }
}
