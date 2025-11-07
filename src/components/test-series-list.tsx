// components/test-series-list.tsx

import { Category, TestSeries } from "@prisma/client";

import { TestSeriesCard } from "@/components/test-series-card";

type TestSeriesWithProgressWithCategory = TestSeries & {
  category: Category | null;
  testChapters: { id: string }[];
  progress: number | null;
};

interface TestSeriesListProps {
  items: TestSeriesWithProgressWithCategory[];
}

export const TestSeriesList = ({
  items
}: TestSeriesListProps) => {
  return (
    <div>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <TestSeriesCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl!}
            chaptersLength={item.testChapters.length}
            price={item.price!}
            progress={item.progress}
            category={item?.category?.name!}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          No test series found
        </div>
      )}
    </div>
  )
}