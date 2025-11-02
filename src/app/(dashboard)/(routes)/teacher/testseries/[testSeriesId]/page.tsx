// app/(dashboard)/(routes)/teacher/testseries/[testSeriesId]/page.tsx

import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { LayoutDashboard, ListChecks, CircleDollarSign, File } from "lucide-react";

import { db } from "@/lib/db";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";

import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";
import { ImageForm } from "./_components/image-form";
import { PriceForm } from "./_components/price-form";
import { ChaptersForm } from "./_components/chapters-form";
import { Actions } from "./_components/actions";

const TestSeriesIdPage = async ({
  params
}: {
  params: { testSeriesId: string }
}) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const testSeries = await db.testSeries.findUnique({
    where: {
      id: params.testSeriesId,
      userId
    },
    include: {
      testChapters: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  if (!testSeries) {
    return redirect("/");
  }

  const requiredFields = [
    testSeries.title,
    testSeries.description,
    testSeries.imageUrl,
    testSeries.price,
    testSeries.categoryId,
    testSeries.testChapters.some(testChapter => testChapter.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!testSeries.isPublished && (
        <Banner
          label="This test series is unpublished. It will not be visible to the students."
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-medium">
              Test Series setup
            </h1>
            <span className="text-sm text-slate-700">
              Complete all fields {completionText}
            </span>
          </div>
          <Actions
            disabled={!isComplete}
            testSeriesId={params.testSeriesId}
            isPublished={testSeries.isPublished}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">
                Customize your test series
              </h2>
            </div>
            <TitleForm
              initialData={testSeries}
              testSeriesId={testSeries.id}
            />
            <DescriptionForm
              initialData={testSeries}
              testSeriesId={testSeries.id}
            />
            <ImageForm
              initialData={testSeries}
              testSeriesId={testSeries.id}
            />

          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={ListChecks} />
                <h2 className="text-xl">
                  Test Chapters
                </h2>
              </div>
              <ChaptersForm
                initialData={testSeries}
                testSeriesId={testSeries.id}
              />
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={CircleDollarSign} />
                <h2 className="text-xl">
                  Sell your test series
                </h2>
              </div>
              <PriceForm
                initialData={testSeries}
                testSeriesId={testSeries.id}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TestSeriesIdPage;