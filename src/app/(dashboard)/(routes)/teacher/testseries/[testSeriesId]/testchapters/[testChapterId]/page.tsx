// app/(dashboard)/(routes)/teacher/testseries/[testSeriesId]/chapters/[testChapterId]/page.tsx

import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, LayoutDashboard, File } from "lucide-react";
import { Button } from "@/components/ui/button";

import { db } from "@/lib/db";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";

import { TestChapterTitleForm } from "./_components/test-chapter-title-form";
import { TestChapterDescriptionForm } from "./_components/test-chapter-description-form";
import { TestChapterActions } from "./_components/test-chapter-actions-form";
import { TestChapterAttachmentForm } from "./_components/test-chapter-attachment-form";
import { SubmissionList } from "@/components/submission-list";

const TestChapterIdPage = async ({
  params
}: {
  params: { testSeriesId: string; testChapterId: string }
}) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const testChapter = await db?.testChapter?.findUnique({
    where: {
      id: params.testChapterId,
      testSeriesId: params.testSeriesId,
    },
    include: {
      attachments: {
        orderBy: {
          createdAt: "desc",
        },
      },
      tests: {
        orderBy: {
          position: "asc",
        }
      },
      submissions: {
        orderBy: {
          createdAt: "desc",
        }
      }
    },
  });

  if (!testChapter) {
    return redirect("/");
  }

  console.log("Test Chapter>>>>", testChapter);
  const requiredFields = [
    testChapter.title,
    testChapter.description,
  ];
  console.log("Required Fields:", requiredFields);
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!testChapter.isPublished && (
        <Banner
          variant="warning"
          label="This chapter is unpublished. It will not be visible in the test series."
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/teacher/testseries/${params.testSeriesId}`}
              className="flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to test series setup
            </Link>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-y-2">
                <h1 className="text-2xl font-medium">
                  Chapter Creation
                </h1>
                <span className="text-sm text-slate-700">
                  Complete all fields {completionText}
                </span>
              </div>
              <TestChapterActions
                disabled={!isComplete}
                testSeriesId={params.testSeriesId}
                testChapterId={params.testChapterId}
                isPublished={testChapter.isPublished}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">
                  Customize your chapter
                </h2>
              </div>
              <TestChapterTitleForm
                initialData={testChapter}
                testSeriesId={params.testSeriesId}
                testChapterId={params.testChapterId}
              />
              <TestChapterDescriptionForm
                initialData={testChapter}
                testSeriesId={params.testSeriesId}
                testChapterId={params.testChapterId}
              />
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={File} />
                <h2 className="text-xl">
                  Resources & Attachments
                </h2>
              </div>
              <TestChapterAttachmentForm
                initialData={{ attachments: testChapter.attachments }}
                testSeriesId={params.testSeriesId}
                testChapterId={params.testChapterId}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-x-2">
            <IconBadge icon={LayoutDashboard} />
            <h2 className="text-xl">
              Tests
            </h2>
          </div>
          <div className="mt-4 space-y-4">
            {(testChapter as any).tests && (testChapter as any).tests.length > 0 ? (
              (testChapter as any).tests.map((test: any) => (
                <div key={test.id} className="flex items-center justify-between border rounded-md p-3 bg-slate-50">
                  <span className="font-medium truncate max-w-[200px]">{test.title}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No tests created yet.</p>
            )}
          </div>

          <div className="mt-8">
            <SubmissionList
              items={(testChapter as any).submissions || []}
              testSeriesId={params.testSeriesId}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default TestChapterIdPage;