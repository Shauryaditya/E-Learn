// app/testseries/[testSeriesId]/page.tsx

import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Clock,
  ClipboardList,
  Timer,
  ChevronRight,
  Star,
} from "lucide-react";

import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { TestSeriesEnrollButton } from "./_components/test-series-enroll";
import { Button } from "@/components/ui/button";

type PageProps = { params: { testSeriesId: string } };

export default async function TestSeriesIdPage({ params }: PageProps) {
  const { userId } = auth();
  if (!userId) redirect("/");

  const testSeries = await db.testSeries.findUnique({
    where: { id: params.testSeriesId },
    include: {
      category: true,
      testChapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        select: { id: true, title: true, description: true, position: true },
      },
    },
  });

  if (!testSeries) redirect("/");

  const purchase = await db.testSeriesPurchase.findUnique({
    where: {
      userId_testSeriesId: { userId, testSeriesId: params.testSeriesId },
    },
  });

  const isPurchased = !!purchase;
  const canView = testSeries.isPublished || isPurchased;
  if (!canView) redirect("/");

  const remainingChapters = isPurchased
    ? 0
    : testSeries.testChapters.length;

  return (
    <div className="min-h-full bg-[#0a0f1e] text-white">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,rgba(59,130,246,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_10%_80%,rgba(99,102,241,0.08),transparent)]" />

        <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-16">
          {/* Back */}
          <Link
            href="/testseries"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Test Series
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-center">
            {/* Left — info */}
            <div className="space-y-6">
              {/* Category badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {testSeries.category && (
                  <span className="text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border border-blue-500/40 text-blue-400 bg-blue-500/10">
                    {testSeries.category.name}
                  </span>
                )}
                <span className="text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-500/40 text-indigo-400 bg-indigo-500/10">
                  ICSE Board
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
                {/* Highlight last two words in blue */}
                {(() => {
                  const words = testSeries.title.split(" ");
                  const regular = words.slice(0, -2).join(" ");
                  const highlight = words.slice(-2).join(" ");
                  return (
                    <>
                      {regular}{" "}
                      <span className="text-blue-400">{highlight}</span>
                    </>
                  );
                })()}
              </h1>

              {/* Meta pills */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-gray-300">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  {testSeries.testChapters.length} Chapters
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5 text-sm text-gray-300">
                  <ClipboardList className="h-4 w-4 text-blue-400" />
                  24 Mock Tests
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5 text-sm text-gray-300">
                  <Timer className="h-4 w-4 text-blue-400" />
                  Timed Evaluation
                </div>
              </div>

              {/* Price + CTA */}
              {isPurchased ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    Enrolled
                  </div>
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-xl px-8">
                    <Link href="#chapters">Continue learning</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-0.5">
                      Lifetime Access
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {testSeries.price != null ? formatPrice(testSeries.price) : "Free"}
                    </p>
                  </div>
                  <TestSeriesEnrollButton
                    testSeriesId={params.testSeriesId}
                    price={testSeries.price ?? 0}
                  />
                </div>
              )}
            </div>

            {/* Right — image card */}
            <div className="hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-[3/4] shadow-2xl">
                {testSeries.imageUrl ? (
                  <Image
                    src={testSeries.imageUrl}
                    alt={testSeries.title}
                    fill
                    className="object-cover"
                    sizes="320px"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white/20" />
                  </div>
                )}
                {/* Rating badge */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-gray-300 font-medium">High Completion Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10">

          {/* ── Left column ── */}
          <div className="space-y-8">

            {/* About */}
            {testSeries.description && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-0.5 h-4 bg-blue-500 rounded-full" />
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                    About this Test Series
                  </h2>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {testSeries.description}
                </p>

                {/* Feature bullets */}
                <ul className="mt-5 space-y-3">
                  {[
                    "Detailed step-by-step solutions for every question.",
                    "Performance analytics and paper correction.",
                    "Designed by former ICSE Board examiners.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructor card */}
            <div className="rounded-2xl border border-white/8 bg-white/4 p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Instructor Portfolio
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  MB
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Mukta Bardhan</p>
                  <p className="text-xs text-gray-500">M.Sc Physics · 20+ Yrs Exp.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column — Chapters ── */}
          <div id="chapters" className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-blue-500 rounded-full" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Test Chapters
                </h2>
              </div>
              {!isPurchased && (
                <span className="text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                  {remainingChapters} Modules Remaining
                </span>
              )}
            </div>

            {testSeries.testChapters.length === 0 ? (
              <div className="flex items-center justify-center h-32 rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">
                No chapters available yet
              </div>
            ) : (
              <div className="space-y-2">
                {testSeries.testChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="group flex items-center gap-5 p-4 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12 transition-all"
                  >
                    {/* Number */}
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                      {String(chapter.position).padStart(2, "0")}
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {chapter.title}
                      </p>
                      {chapter.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    {/* Right — availability + action */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      {isPurchased ? (
                        <Button
                          asChild
                          size="sm"
                          className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 hover:border-blue-500 rounded-lg transition-all text-xs"
                        >
                          <Link href={`/testseries/${testSeries.id}/testChapter/${chapter.id}`}>
                            Start
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">
                              Availability
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              Restricted Access
                            </p>
                          </div>
                          <Lock className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom CTA banner ── */}
        {!isPurchased && (
          <div className="mt-12 rounded-2xl border border-white/8 bg-white/4 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Ready to start practicing?
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Enroll in the full test series to unlock all chapters and receive a personalized roadmap to ICSE board perfection.
              </p>
            </div>
            <div className="flex-shrink-0">
              <TestSeriesEnrollButton
                testSeriesId={params.testSeriesId}
                price={testSeries.price ?? 0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}