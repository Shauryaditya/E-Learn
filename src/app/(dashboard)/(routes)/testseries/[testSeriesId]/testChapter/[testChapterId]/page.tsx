import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { File, CheckCircle } from "lucide-react";
import { TestMode } from "@prisma/client";

import { Banner } from "@/components/banner";
import { Separator } from "@/components/ui/separator";
import { Preview } from "@/components/preview";
import DocumentPreview from "@/components/document-preview";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { TestSeriesEnrollButton } from "../../_components/test-series-enroll";
import { TestSubmissionForm } from "@/components/test-submission-form";

type PageProps = {
  params: { testSeriesId: string; testChapterId: string };
};

export default async function TestSeriesChapterPage({ params }: PageProps) {
  const { userId } = auth();
  if (!userId) redirect("/");

  // Load chapter + parent series + attachments + tests + submissions
  const chapter = await db.testChapter.findUnique({
    where: { id: params.testChapterId },
    include: {
      submissions: {
        where: {
          userId,
        }
      },
      testSeries: {
        include: {
          testSeriesPurchase: { where: { userId } },
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
      },
      tests: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
      },
    },
  });
  console.log("chapte??", chapter);

  if (!chapter || chapter.testSeries.id !== params.testSeriesId) {
    redirect("/");
  }

  const purchased = !!chapter.testSeries.testSeriesPurchase.length;
  const canView = chapter.testSeries.isPublished || purchased;
  if (!canView) redirect("/");

  // Lock attachments for non-buyers (tests can still be free/locked per item)
  const isLocked = !purchased;

  const existingSubmission = chapter.submissions[0];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header / breadcrumbs */}
      <div className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            <Link href={`/testseries/${chapter.testSeries.id}`} className="underline">
              {chapter.testSeries.title}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold">{chapter.title}</h1>
        </div>

        {!purchased ? (
          <div className="flex items-center gap-3">
            {chapter.testSeries.price != null && (
              <span className="text-lg font-semibold">
                {formatPrice(chapter.testSeries.price)}
              </span>
            )}
            <TestSeriesEnrollButton
              testSeriesId={chapter.testSeries.id}
              price={chapter.testSeries.price ?? 0}
            />
          </div>
        ) : null}
      </div>

      {/* Informational banners */}
      {!purchased && (
        <Banner
          variant="warning"
          label="Buy this test series to unlock all attachments and tests (non-free)."
        />
      )}

      <Separator className="my-6" />

      {/* Chapter description */}
      {chapter.description ? (
        <div className="">
          <Preview value={chapter.description} />
        </div>
      ) : null}

      {/* Attachments */}
      {chapter.attachments.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="p-4">
            <h2 className="text-sm font-semibold text-blue-800 mb-3">
              Question Paper
            </h2>

            {isLocked && (
              <p className="text-red-500 mb-3">
                Purchase the test series to view and download attachments.
              </p>
            )}

            <div className="grid gap-4">
              {chapter.attachments.map((a) => (
                <div
                  key={a.id}
                  className={`bg-white w-full p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition ${isLocked ? "blur-sm select-none pointer-events-none" : ""
                    }`}
                >
                  {/* Optional name/label above the preview */}
                  {a.name && (
                    <div className="mb-2 text-sm font-medium text-gray-800">
                      {a.name}
                    </div>
                  )}

                  {/* Preview the document */}
                  <DocumentPreview fileUrl={a.url} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tests list */}
      <Separator className="my-6" />
      <div className="p-4">
        <h2 className="text-lg font-medium mb-4">Submit Answer Sheet</h2>
        {existingSubmission ? (
          <div className="flex items-center gap-x-2 text-emerald-700 bg-emerald-50 p-3 rounded-md">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Submitted</p>
              <a
                href={existingSubmission.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:text-emerald-800"
              >
                View your submission
              </a>
            </div>
          </div>
        ) : (
          <TestSubmissionForm
            testSeriesId={chapter.testSeries.id}
            testChapterId={chapter.id} />
        )}
      </div>
    </div>
  );
}
