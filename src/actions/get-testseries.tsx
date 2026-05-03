// actions/get-test-series.ts

import { Category, TestSeries } from "@prisma/client";

import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";

type TestSeriesWithProgressWithCategory = TestSeries & {
  category: Category | null;
  testChapters: { id: string }[];
  progress: number | null;
};

type GetTestSeries = {
  userId?: string | null;
  title?: string;
  categoryId?: string;
};

export const getTestSeries = async ({
  userId,
  title,
  categoryId
}: GetTestSeries): Promise<TestSeriesWithProgressWithCategory[]> => {
  try {
    const testSeries = await db.testSeries.findMany({
      where: {
        isPublished: true,
        title: title ? { contains: title } : undefined,
        categoryId: categoryId || undefined,
      },
      include: {
        category: true,
        testChapters: {
          where: { isPublished: true },
          select: { id: true },
        },
        // Only filter purchases if userId exists
        testSeriesPurchase: userId
          ? { where: { userId } }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    const testSeriesWithProgress: TestSeriesWithProgressWithCategory[] = await Promise.all(
      testSeries.map(async (series) => {
        // No userId or not purchased — no progress
        if (!userId || !series.testSeriesPurchase || series.testSeriesPurchase.length === 0) {
          return { ...series, progress: null };
        }

        const progressPercentage = await getProgress(userId, series.id);
        return { ...series, progress: progressPercentage };
      })
    );

    return testSeriesWithProgress;
  } catch (error) {
    console.log("[GET_TEST_SERIES]", error);
    return [];
  }
};