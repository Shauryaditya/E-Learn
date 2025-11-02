// app/teacher/testseries/create/page.tsx
import { db } from "@/lib/db";
import CreateTestSeries from "./_components/CreateTestSeries";

const CreateTestSeriesPage = async () => {
  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <CreateTestSeries 
      options={categories.map((category) => ({
        label: category.name,
        value: category.id,
      }))}
    />
  );
};

export default CreateTestSeriesPage;