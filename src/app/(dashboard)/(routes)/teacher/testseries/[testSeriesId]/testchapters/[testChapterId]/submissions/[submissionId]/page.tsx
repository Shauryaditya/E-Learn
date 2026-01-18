import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import dynamic from "next/dynamic";
const GradingInterface = dynamic(
    () => import("@/components/grading/grading-interface"),
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
            testChapter: true
        }
    });

    if (!submission) {
        return redirect("/");
    }

    // Pass the submission data to the client component
    return (
        <div className="h-full w-full">
            <GradingInterface
                submission={submission}
                testSeriesId={params.testSeriesId}
                testChapterId={params.testChapterId}
            />
        </div>
    );
}

export default SubmissionGradingPage;
