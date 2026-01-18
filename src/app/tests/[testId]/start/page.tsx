import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TestSubmissionForm } from "@/components/test-submission-form";
import { Banner } from "@/components/banner";
import { Preview } from "@/components/preview";
import { File, CheckCircle } from "lucide-react";

interface TestIdStartPageProps {
    params: {
        testId: string;
    };
}

const TestIdStartPage = async ({
    params
}: TestIdStartPageProps) => {
    const { userId } = auth();

    if (!userId) {
        return redirect("/");
    }

    const test = await db.test.findUnique({
        where: {
            id: params.testId,
        },
        include: {
            testChapter: {
                include: {
                    testSeries: true,
                    attachments: true
                }
            },
            submissions: {
                where: {
                    userId,
                }
            }
        }
    });

    if (!test) {
        return redirect("/");
    }

    // Check if already submitted
    const existingSubmission = test.submissions[0];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">{test.title}</h1>
                <div className="text-sm text-slate-500 flex items-center gap-x-2 mt-2">
                    <span>Marks: {test.totalMarks}</span>
                    <span>•</span>
                    <span>Duration: {test.duration} mins</span>
                </div>
            </div>

            {test.description && (
                <div className="mb-6 bg-slate-50 p-4 rounded-md border">
                    <Preview value={test.description} />
                </div>
            )}

            {/* If there are attachments on the chapter (Question Paper), show them here too or assume they downloaded from previous screen */}
            {test.testChapter.attachments.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-medium mb-2">Reference Materials:</h3>
                    <div className="flex flex-col gap-2">
                        {test.testChapter.attachments.map((att) => (
                            <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                className="flex items-center p-2 bg-sky-50 border-sky-200 border rounded-md text-sky-700 hover:underline"
                            >
                                <File className="h-4 w-4 mr-2" />
                                {att.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="border p-6 rounded-md shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Submission</h2>

                {test.mode === "DESCRIPTIVE" ? (
                    <>
                        {existingSubmission ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 text-emerald-700 rounded-md">
                                <CheckCircle className="h-10 w-10 mb-2" />
                                <h3 className="font-bold text-lg">Submitted Successfully</h3>
                                <p className="text-sm mb-4">You have already submitted your response.</p>
                                <a
                                    href={existingSubmission.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    View your submission
                                </a>
                            </div>
                        ) : (
                            <>
                                <Banner variant="warning" label="Please upload your answer sheet as a PDF file." />
                                <TestSubmissionForm
                                    testSeriesId={test.testChapter.testSeries.id}
                                    testChapterId={test.testChapter.id}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        Objective test interface not implemented yet.
                    </div>
                )}
            </div>
        </div>
    );
}

export default TestIdStartPage;
