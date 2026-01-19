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
  userId: string;
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
        title: {
          contains: title,
        },
        categoryId,
      },
      include: {
        category: true,
        testChapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        testSeriesPurchase: {
          where: {
            userId,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    const testSeriesWithProgress: TestSeriesWithProgressWithCategory[] = await Promise.all(
      testSeries.map(async testSeries => {
        if (testSeries.testSeriesPurchase.length === 0) {
          return {
            ...testSeries,
            progress: null,
          }
        }

        const progressPercentage = await getProgress(userId, testSeries.id);

        return {
          ...testSeries,
          progress: progressPercentage,
        };
      })
    );

    return testSeriesWithProgress;
  } catch (error) {
    console.log("[GET_TEST_SERIES]", error);
    return [];
  }
}