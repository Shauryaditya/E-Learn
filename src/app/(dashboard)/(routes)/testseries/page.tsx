import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { SearchInput } from "@/components/search-input";
import { getTestSeries } from "@/actions/get-testseries";
import { TestSeriesList } from "@/components/test-series-list";


interface SearchPageProps {
  searchParams: {
    title: string;
    categoryId: string;
  }
}

const TestSeriesSearchPage = async ({
  searchParams
}: SearchPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }


  const testSeries = await getTestSeries({
    userId,
    ...searchParams,
  });

  return (
    <>
      <div className="px-6 pt-6 md:hidden md:mb-0 block">
        <SearchInput />
      </div>
      <div className="p-6 space-y-4">

        <TestSeriesList items={testSeries} />
      </div>
    </>
  );
}

export default TestSeriesSearchPage;