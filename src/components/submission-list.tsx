"use client";

import { TestSubmission } from "@prisma/client";
import { File, CheckCircle, XCircle } from "lucide-react";

interface SubmissionListProps {
    items: TestSubmission[];
    testSeriesId: string;
}

export const SubmissionList = ({ items, testSeriesId }: SubmissionListProps) => {
    return (
        <div>
            <div className="text-xl font-bold mb-4">Student Submissions</div>
            {items.length === 0 && (
                <div className="text-center text-sm text-muted-foreground mt-10">
                    No submissions found
                </div>
            )}
            <div className="grid grid-cols-1 gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between border rounded-md p-3 bg-slate-50"
                    >
                        <div className="flex items-center gap-x-2">
                            <File className="h-5 w-5 text-sky-700" />
                            <div className="flex flex-col">
                                <a
                                    href={item.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium hover:underline text-sky-700"
                                >
                                    View PDF Submission
                                </a>
                                <span className="text-xs text-muted-foreground">
                                    Submitted on {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div>
                            {/* Placeholder for future status badge */}
                            <span className={`text-xs px-2 py-1 rounded-full mr-2 ${item.status === "REVIEWED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}>
                                {item.status}
                            </span>
                            <a
                                href={`/teacher/testseries/${testSeriesId}/testchapters/${item.testChapterId}/submissions/${item.id}`}
                                className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full hover:bg-sky-200 transition"
                            >
                                Grade
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
