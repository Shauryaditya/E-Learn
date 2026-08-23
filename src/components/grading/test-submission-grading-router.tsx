"use client";

import type { TestSubmission } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import GradingInterface from "@/components/grading/grading-interface";
import TestImageGradingInterface from "@/components/grading/test-image-grading-interface";

interface TestSubmissionGradingRouterProps {
    submission: TestSubmission;
    testSeriesId: string;
    testChapterId: string;
}

type LegacyFileKind = "checking" | "image" | "pdf" | "missing";

const getInitialFileKind = (submission: TestSubmission): LegacyFileKind => {
    if (submission.images.length > 0) return "image";
    if (!submission.pdfUrl) return "missing";

    const fileName = submission.fileName?.toLowerCase();
    if (fileName?.endsWith(".pdf")) return "pdf";
    if (fileName?.match(/\.(avif|gif|heic|heif|jpe?g|png|webp)$/)) return "image";

    return "checking";
};

export const TestSubmissionGradingRouter = ({
    submission,
    testSeriesId,
    testChapterId,
}: TestSubmissionGradingRouterProps) => {
    const hasStoredImages = submission.images.length > 0;
    const [legacyFileKind, setLegacyFileKind] = useState<LegacyFileKind>(() =>
        getInitialFileKind(submission)
    );

    useEffect(() => {
        if (legacyFileKind !== "checking" || !submission.pdfUrl) return;

        // Older versions accepted an image but saved its URL in pdfUrl. Trying it
        // as an image first avoids sending image bytes to PDF.js.
        const imageProbe = new Image();
        imageProbe.onload = () => setLegacyFileKind("image");
        imageProbe.onerror = () => setLegacyFileKind("pdf");
        imageProbe.src = submission.pdfUrl;

        return () => {
            imageProbe.onload = null;
            imageProbe.onerror = null;
        };
    }, [legacyFileKind, submission.pdfUrl]);

    if (legacyFileKind === "checking") {
        return (
            <div className="flex min-h-[400px] items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting submission format...
            </div>
        );
    }

    if (legacyFileKind === "image") {
        const imageSubmission = hasStoredImages
            ? submission
            : { ...submission, images: [submission.pdfUrl!] };

        return <TestImageGradingInterface submission={imageSubmission} />;
    }

    if (legacyFileKind === "pdf" && submission.pdfUrl) {
        return (
            <GradingInterface
                submission={submission}
                testSeriesId={testSeriesId}
                testChapterId={testChapterId}
            />
        );
    }

    return (
        <div className="p-6 text-sm text-muted-foreground">
            This submission does not contain a PDF or any images.
        </div>
    );
};

export default TestSubmissionGradingRouter;
