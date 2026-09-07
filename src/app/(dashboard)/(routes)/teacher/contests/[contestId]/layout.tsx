import { auth } from "@clerk/nextjs";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ContestWorkspaceNav } from "./_components/contest-workspace-nav";

export default async function ContestWorkspaceLayout({ children, params }: {
  children: React.ReactNode; params: { contestId: string };
}) {
  const { userId } = auth();
  if (!userId) redirect("/");
  const contest = await db.contest.findFirst({
    where: { id: params.contestId, userId },
    select: { title: true, isPublished: true },
  });
  if (!contest) notFound();
  return (
    <div className="min-w-0 bg-background text-foreground">
      <header className="space-y-4 px-4 pt-6 sm:px-6">
        <Link href="/teacher/contests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />All contests
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 break-words text-2xl font-semibold">{contest.title}</h1>
          <Badge variant="outline">{contest.isPublished ? "Published" : "Draft"}</Badge>
        </div>
        <ContestWorkspaceNav contestId={params.contestId} />
      </header>
      {children}
    </div>
  );
}
