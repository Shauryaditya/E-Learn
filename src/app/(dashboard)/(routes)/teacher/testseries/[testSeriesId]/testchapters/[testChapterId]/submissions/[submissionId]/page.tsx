import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import dynamic from "next/dynamic";
const TestSubmissionGradingRouter = dynamic(
    () => import("@/components/grading/test-submission-grading-router"),
    { ssr: false }
);

const SubmissionGradingPage = async ({
    params
}: {
    params: { testSeriesId: string; testChapterId: string; submissionId: string }
}) => {
    const { userId } = auth();

    if (!userId) {
        return redirect("/");
    }

    const submission = await db.testSubmission.findUnique({
        where: {
            id: params.submissionId,
        },
        include: {
            testChapter: {
                include: {
                    testSeries: {
                        select: { userId: true }
                    }
                }
            }
        }
    });

    if (
        !submission ||
        submission.testChapterId !== params.testChapterId ||
        submission.testChapter.testSeriesId !== params.testSeriesId ||
        submission.testChapter.testSeries.userId !== userId
    ) {
        return redirect("/");
    }

    return (
        <div className="h-full w-full">
            <TestSubmissionGradingRouter
                submission={submission}
                testSeriesId={params.testSeriesId}
                testChapterId={params.testChapterId}
            />
        </div>
    );
}

export default SubmissionGradingPage;
