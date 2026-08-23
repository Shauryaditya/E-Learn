import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Lock,
  Star,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { TestSeriesEnrollButton } from "./_components/test-series-enroll";

type PageProps = { params: { testSeriesId: string } };

export default async function TestSeriesIdPage({ params }: PageProps) {
  const { userId } = auth();

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

  const purchase = userId
    ? await db.testSeriesPurchase.findUnique({
        where: {
          userId_testSeriesId: { userId, testSeriesId: params.testSeriesId },
        },
      })
    : null;

  const isPurchased = !!purchase;
  const canView = testSeries.isPublished || isPurchased;
  if (!canView) redirect("/testseries");

  const remainingChapters = isPurchased ? 0 : testSeries.testChapters.length;
  const firstChapter = testSeries.testChapters[0];

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="relative overflow-hidden border-b bg-card dark:bg-[#0a0f1e]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,rgba(59,130,246,0.12),transparent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
          <Link
            href="/testseries"
            className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Test Series
          </Link>

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {testSeries.category && (
                  <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                    {testSeries.category.name}
                  </span>
                )}
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                  ICSE Board
                </span>
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
                {(() => {
                  const words = testSeries.title.split(" ");
                  const regular = words.slice(0, -2).join(" ");
                  const highlight = words.slice(-2).join(" ");
                  return (
                    <>
                      {regular}{" "}
                      <span className="text-blue-500 dark:text-blue-400">
                        {highlight}
                      </span>
                    </>
                  );
                })()}
              </h1>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  {testSeries.testChapters.length} Chapters
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                  24 Mock Tests
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4 text-blue-500" />
                  Timed Evaluation
                </div>
              </div>

              {isPurchased ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                    Enrolled
                  </div>
                  {firstChapter && (
                    <Button asChild size="lg" className="rounded-xl px-8">
                      <Link
                        href={`/testseries/${testSeries.id}/testChapter/${firstChapter.id}`}
                      >
                        Continue learning
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-5">
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Lifetime Access
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {testSeries.price != null
                        ? formatPrice(testSeries.price)
                        : "Free"}
                    </p>
                  </div>
                  <TestSeriesEnrollButton
                    testSeriesId={params.testSeriesId}
                    price={testSeries.price ?? 0}
                  />
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border bg-muted shadow-2xl">
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
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-slate-200">
                      High Completion Rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr]">
          <div className="space-y-8">
            {testSeries.description && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-4 w-0.5 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    About this Test Series
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {testSeries.description}
                </p>

                <ul className="mt-5 space-y-3">
                  {[
                    "Detailed step-by-step solutions for every question.",
                    "Performance analytics and paper correction.",
                    "Designed by former ICSE Board examiners.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      <span className="text-sm text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Instructor Portfolio
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  MB
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Mukta Bardhan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    M.Sc Physics - 20+ Yrs Exp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div id="chapters" className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 rounded-full bg-blue-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Test Chapters
                </h2>
              </div>
              {!isPurchased && (
                <span className="rounded-full border bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {remainingChapters} Modules Remaining
                </span>
              )}
            </div>

            {testSeries.testChapters.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                No chapters available yet
              </div>
            ) : (
              <div className="space-y-2">
                {testSeries.testChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="group flex items-center gap-5 rounded-xl border bg-card p-4 transition-all hover:bg-muted/60"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground transition-colors group-hover:text-foreground">
                      {String(chapter.position).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {chapter.title}
                      </p>
                      {chapter.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-3">
                      {isPurchased ? (
                        <Button asChild size="sm" className="rounded-lg text-xs">
                          <Link
                            href={`/testseries/${testSeries.id}/testChapter/${chapter.id}`}
                          >
                            Start
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="hidden text-right sm:block">
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Availability
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                              Restricted Access
                            </p>
                          </div>
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isPurchased && (
          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border bg-card p-8 md:flex-row">
            <div>
              <h3 className="mb-1 text-xl font-bold text-foreground">
                Ready to start practicing?
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Enroll in the full test series to unlock all chapters and
                receive a personalized roadmap to ICSE board perfection.
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
