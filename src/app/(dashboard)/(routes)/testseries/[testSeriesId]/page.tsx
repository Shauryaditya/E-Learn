// app/testseries/[testSeriesId]/page.tsx

import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { TestSeriesEnrollButton } from "./_components/test-series-enroll";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
        },
      },
    },
  });

  if (!testSeries) redirect("/");

  const purchase = await db.testSeriesPurchase.findUnique({
    where: { userId_testSeriesId: { userId, testSeriesId: params.testSeriesId } },
  });

  const isPurchased = !!purchase;
  const canView = testSeries.isPublished || isPurchased;
  if (!canView) redirect("/");

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto p-6">
        {/* Back Button */}
        <Link
          href="/testseries"
          className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Series
        </Link>

        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Image */}
          <div className="md:col-span-1">
            {testSeries.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={testSeries.imageUrl}
                  alt={testSeries.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{testSeries.title}</h1>
              {testSeries.category && (
                <p className="text-sm text-muted-foreground">
                  {testSeries.category.name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-x-2 text-sm">
              <div className="flex items-center gap-x-1">
                <BookOpen className="w-4 h-4" />
                <span>{testSeries.testChapters.length} Chapters</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-x-2">
              {isPurchased ? (
                <div className="space-y-2 w-full">
                  <div className="bg-emerald-100 border border-emerald-200 rounded-md p-3">
                    <p className="text-sm text-emerald-700 font-medium">
                      ✓ You have enrolled in this test series
                    </p>
                  </div>
                  <Button asChild className="w-full" size="lg">
                    <Link href="#chapters">Continue Learning</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 w-full">
                  {testSeries.price != null && (
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">
                        {formatPrice(testSeries.price)}
                      </p>
                    </div>
                  )}
                  <TestSeriesEnrollButton
                    testSeriesId={params.testSeriesId}
                    price={testSeries.price ?? 0}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Description Section */}
        {testSeries.description && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">About this Test Series</h2>
            <div className="bg-slate-50 border rounded-lg p-6">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {testSeries.description}
              </p>
            </div>
          </div>
        )}

        <Separator className="my-8" />

        {/* Chapters Section */}
        <div id="chapters">
          <h2 className="text-xl font-semibold mb-4">
            Test Chapters ({testSeries.testChapters.length})
          </h2>

          {testSeries.testChapters.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-slate-50">
              <p className="text-muted-foreground">No chapters available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testSeries.testChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="border rounded-lg p-5 bg-white hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-x-2 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-700 text-sm font-semibold">
                          {chapter.position}
                        </span>
                        <h3 className="text-lg font-semibold">{chapter.title}</h3>
                      </div>
                      {chapter.description && (
                        <p className="text-sm text-slate-600 ml-10">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-x-2">
                      {isPurchased ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/testseries/${testSeries.id}/testChapter/${chapter.id}`}>
                            Start Chapter
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
