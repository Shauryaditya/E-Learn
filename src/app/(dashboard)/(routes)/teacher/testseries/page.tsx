import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

async function getData(): Promise<any[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ];
}

const TestSeries = async () => {
  const { userId } = auth();

  if(!userId) {
    return redirect("/")
  }

  const TestSeries = await db.course.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    }
  })
  return (
    <div className="p-6">
      <DataTable columns={columns} data={TestSeries} />
    </div>
  );
};

export default TestSeries;
