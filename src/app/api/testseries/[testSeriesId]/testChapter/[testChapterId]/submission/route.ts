import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: { testSeriesId: string; testChapterId: string } }
) {
    try {
        const { userId } = auth();
        const { pdfUrl } = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!pdfUrl) {
            return new NextResponse("PDF URL is required", { status: 400 });
        }

        const submission = await db.testSubmission.create({
            data: {
                userId,
                testChapterId: params.testChapterId,
                pdfUrl: pdfUrl,
                status: "SUBMITTED",
            }
        });

        return NextResponse.json(submission);

    } catch (error) {
        console.log("[TEST_SUBMISSION]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
