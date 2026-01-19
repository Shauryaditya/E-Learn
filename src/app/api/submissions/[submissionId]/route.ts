import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: { submissionId: string } }
) {
    try {
        const { userId } = auth();
        const {
            marksAwarded,
            feedback,
            annotatedPdfUrl,
            status
        } = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!params.submissionId) {
            return new NextResponse("Submission ID required", { status: 400 });
        }

        const submission = await db.testSubmission.update({
            where: {
                id: params.submissionId,
            },
            data: {
                marksAwarded,
                feedback,
                annotatedPdfUrl,
                status,
                reviewedBy: userId,
                reviewedAt: new Date(),
            },
        });

        return NextResponse.json(submission);
    } catch (error) {
        console.log("[SUBMISSION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
