import { db } from "@/lib/db";
import { CreateContestForm } from "./_components/create-contest-form";

const CreateContestPage = async () => {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <CreateContestForm
      categories={categories.map((category) => ({
        label: category.name,
        value: category.id,
      }))}
    />
  );
};

export default CreateContestPage;
