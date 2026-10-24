import { auth } from "@clerk/nextjs";
import { ResourceCategory, ResourceType } from "@prisma/client";
import { Archive, FileSearch } from "lucide-react";
import { redirect } from "next/navigation";

import { getResources } from "@/actions/get-resources";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ResourceFilters } from "./_components/resource-filters";
import { StudentResourcesList } from "./_components/student-resources-list";

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const unique = <T extends string | number>(values: (T | null)[]) => Array.from(new Set(values.filter((value): value is T => value !== null))).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

export default async function StudentResourcesPage({ searchParams }: { searchParams: SearchParams }) {
  const { userId } = auth();
  if (!userId) redirect("/");

  const requestedCategory = one(searchParams.category) || "SCHOOL";
  const category = Object.values(ResourceCategory).includes(requestedCategory as ResourceCategory)
    ? requestedCategory as ResourceCategory
    : undefined;
  const requestedType = one(searchParams.type);
  const type = requestedType && Object.values(ResourceType).includes(requestedType as ResourceType)
    ? requestedType as ResourceType
    : undefined;
  const requestedYear = Number(one(searchParams.year));

  const [resources, metadata] = await Promise.all([
    getResources({
      category,
      type,
      search: one(searchParams.q) || one(searchParams.title),
      schoolName: one(searchParams.school),
      board: one(searchParams.board),
      grade: one(searchParams.grade),
      subject: one(searchParams.subject),
      examType: one(searchParams.examType),
      year: Number.isInteger(requestedYear) && requestedYear > 0 ? requestedYear : undefined,
    }),
    db.resource.findMany({
      select: { schoolName: true, board: true, grade: true, subject: true, year: true, examType: true },
    }),
  ]);

  const options = {
    schools: unique(metadata.map(item => item.schoolName)),
    boards: unique(metadata.map(item => item.board)),
    grades: unique(metadata.map(item => item.grade)),
    subjects: unique(metadata.map(item => item.subject)),
    years: unique(metadata.map(item => item.year)).sort((a, b) => b - a),
    examTypes: unique(metadata.map(item => item.examType)),
  };

  return (
    <div className="min-h-full bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-muted"><Archive className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-2xl font-bold tracking-normal sm:text-3xl">Paper Vault</h1><Badge className="bg-emerald-600 text-white hover:bg-emerald-600">NEW</Badge></div>
              <p className="mt-1 text-sm text-muted-foreground">Previous-year school papers, board papers, and exam resources in one searchable library.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-label="Paper filters" className="border-b pb-6">
          <ResourceFilters options={options} />
        </section>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-semibold">{resources.length} {resources.length === 1 ? "paper" : "papers"} found</h2></div>
        </div>
        <StudentResourcesList items={resources} />
      </main>
    </div>
  );
}
