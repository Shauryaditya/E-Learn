import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Clock, MessageSquare, Star } from "lucide-react";

import { Banner } from "@/components/banner";
import { Preview } from "@/components/preview";
import DocumentPreview from "@/components/document-preview";
import { formatPrice } from "@/lib/format";
import { TestSeriesEnrollButton } from "../../_components/test-series-enroll";
import { TestSubmissionForm } from "@/components/test-submission-form";

type PageProps = {
  params: { testSeriesId: string; testChapterId: string };
};

export default async function TestSeriesChapterPage({ params }: PageProps) {
  const { userId } = auth();
  if (!userId) redirect("/");

  const chapter = await db.testChapter.findUnique({
    where: { id: params.testChapterId },
    include: {
      submissions: {
        where: { userId },
        orderBy: { createdAt: "desc" },
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

  if (!chapter || chapter.testSeries.id !== params.testSeriesId) redirect("/");

  const purchased = !!chapter.testSeries.testSeriesPurchase.length;
  const canView = chapter.testSeries.isPublished || purchased;
  if (!canView) redirect("/");

  const isLocked = !purchased;
  const existingSubmission = chapter.submissions[0];
  const isReviewed = existingSubmission?.status === "REVIEWED";

  return (
    <div className="min-h-full bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pb-20 pt-6 space-y-6">

        {/* ── Breadcrumb + header ── */}
        <div>
          <Link
            href={`/testseries/${chapter.testSeries.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {chapter.testSeries.title}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {chapter.title}
            </h1>

            {!purchased && chapter.testSeries.price != null && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-lg font-bold text-white">
                  {formatPrice(chapter.testSeries.price)}
                </span>
                <TestSeriesEnrollButton
                  testSeriesId={chapter.testSeries.id}
                  price={chapter.testSeries.price ?? 0}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Purchase banner ── */}
        {!purchased && (
          <Banner
            variant="warning"
            label="Enroll in this test series to unlock all attachments and tests."
          />
        )}

        {/* ── Description ── */}
        {chapter.description && (
          <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
            <Preview value={chapter.description} />
          </div>
        )}

        {/* ── Question Paper ── */}
        {chapter.attachments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-blue-500 rounded-full" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Question Paper
              </h2>
            </div>

            {isLocked ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                Purchase the test series to view and download the question paper.
              </div>
            ) : (
              <div className="grid gap-3">
                {chapter.attachments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-white/6 bg-white/3 p-4 overflow-hidden"
                  >
                    {a.name && (
                      <p className="text-sm font-medium text-gray-300 mb-3">{a.name}</p>
                    )}
                    <DocumentPreview fileUrl={a.url} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Submission section ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-blue-500 rounded-full" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Answer Sheet
            </h2>
          </div>

          {existingSubmission ? (
            isReviewed ? (
              /* ── REVIEWED STATE ── */
              <div className="space-y-4">

                {/* Score card row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Marks */}
                  <div className="rounded-2xl border border-white/6 bg-white/4 p-5 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      Total Score
                    </p>
                    {existingSubmission.marksAwarded !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">
                          {existingSubmission.marksAwarded}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">/100</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not graded</p>
                    )}
                    {existingSubmission.marksAwarded !== null && (
                      <div className="mt-3 h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${Math.min(existingSubmission.marksAwarded, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-1 flex flex-col justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-base font-semibold text-emerald-400">Reviewed</span>
                    </div>
                    <a
                      href={existingSubmission.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition"
                    >
                      View original submission
                    </a>
                  </div>
                </div>

                {/* Teacher feedback */}
                {existingSubmission.feedback && (
                  <div className="rounded-2xl border border-white/6 bg-white/4 p-5 space-y-4">
                    {/* Teacher header */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        T
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Teacher Feedback</p>
                        <p className="text-xs text-gray-500">Reviewed by your instructor</p>
                      </div>
                      <MessageSquare className="h-4 w-4 text-gray-600 ml-auto" />
                    </div>

                    {/* Quote */}
                    <div className="border-l-2 border-blue-500/50 pl-4">
                      <p className="text-sm text-gray-300 leading-relaxed italic whitespace-pre-wrap">
                        "{existingSubmission.feedback}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Annotated PDF */}
                {existingSubmission.annotatedPdfUrl && (
                  <a
                    href={existingSubmission.annotatedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-400">
                        View Checked Copy
                      </p>
                      <p className="text-xs text-gray-500">Annotated by your instructor</p>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-blue-400 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}
              </div>
            ) : (
              /* ── SUBMITTED, PENDING REVIEW ── */
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <p className="text-sm font-semibold text-amber-400">
                    Submission under review
                  </p>
                </div>
                <p className="text-xs text-gray-500 ml-7">
                  Your answer sheet has been submitted and is awaiting review from your instructor.
                </p>
                <a
                  href={existingSubmission.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-7 text-xs text-gray-400 hover:text-white underline underline-offset-2 transition"
                >
                  View your submission
                </a>
              </div>
            )
          ) : (
            /* ── NO SUBMISSION YET ── */
            <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
              <TestSubmissionForm
                testSeriesId={chapter.testSeries.id}
                testChapterId={chapter.id}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}