
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { isTeacher } from "@/lib/teacher";
import { getResources } from "@/actions/get-resources";
import { ResourcesList } from "./_components/resources-list";
import { ResourceForm } from "./_components/resource-form";

const ResourcesPage = async () => {
  const { userId } = auth();

  if (!userId || !isTeacher(userId)) {
    return redirect("/");
  }

  const resources = await getResources({});

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <header className="border-b pb-5">
        <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Content library</p>
        <h1 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">Paper Vault manager</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Publish properly labelled school papers and exam resources students can discover by class, school, subject, board, and year.</p>
      </header>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <section className="rounded-md border bg-card p-4 sm:p-6">
          <ResourceForm />
        </section>
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Published papers</h2><p className="mt-1 text-sm text-muted-foreground">{resources.length} total</p></div>
          </div>
          <ResourcesList items={resources} />
        </section>
      </div>
    </div>
  );
}

export default ResourcesPage;
