import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: { testSeriesId: string; testChapterId: string } }
) {
    try {
        const { userId } = auth();
        const { pdfUrl, images, fileName, fileSize } = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const submittedPdfUrl = typeof pdfUrl === "string" && pdfUrl.trim().length > 0
            ? pdfUrl
            : null;
        const submittedImages = Array.isArray(images)
            ? images.filter((url): url is string => typeof url === "string" && url.length > 0)
            : [];

        if ((!submittedPdfUrl && submittedImages.length === 0) || (submittedPdfUrl && submittedImages.length > 0)) {
            return new NextResponse("Submit either one PDF or at least one image", { status: 400 });
        }

        if (submittedImages.length > 15) {
            return new NextResponse("A maximum of 15 images can be submitted", { status: 400 });
        }

        const testChapter = await db.testChapter.findFirst({
            where: {
                id: params.testChapterId,
                testSeriesId: params.testSeriesId,
            },
            select: { id: true },
        });

        if (!testChapter) {
            return new NextResponse("Test chapter not found", { status: 404 });
        }

        const submission = await db.testSubmission.create({
            data: {
                userId,
                testChapterId: params.testChapterId,
                pdfUrl: submittedPdfUrl,
                images: submittedImages,
                annotatedImages: [],
                fileName: typeof fileName === "string" ? fileName : null,
                fileSize: Number.isInteger(fileSize) ? fileSize : null,
                status: "SUBMITTED",
            }
        });

        return NextResponse.json(submission);

    } catch (error) {
        console.log("[TEST_SUBMISSION]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
