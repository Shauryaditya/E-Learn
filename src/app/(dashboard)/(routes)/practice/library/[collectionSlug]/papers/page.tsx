import { auth } from "@clerk/nextjs";
import { ArrowRight, CalendarDays, Download, FileText } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPracticeCollection } from "@/actions/get-practice-collections";
import { Badge } from "@/components/ui/badge";
import { CollectionHeader } from "../_components/collection-header";

export default async function CollectionPapersPage({ params }: { params: { collectionSlug: string } }) {
  const { userId } = auth();
  if (!userId) redirect("/");
  const collection = await getPracticeCollection(params.collectionSlug, userId); if (!collection) notFound();
  return <div className="min-h-full bg-background"><CollectionHeader collection={collection} title="Available papers" description="Complete papers grouped by year and examination" /><main className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><div className="overflow-hidden rounded-lg border bg-card"><div className="divide-y">{collection.papers.map(paper => <article key={paper.id} className="grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center sm:px-5"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><FileText className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold">{paper.title}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{paper.year} &middot; {paper.exam}</p></div><Badge variant="secondary">{paper.questionCount} questions</Badge><div className="flex items-center gap-3">{paper.url && <Link href={paper.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-semibold"><Download className="mr-1.5 h-3.5 w-3.5" />Original</Link>}<Link href={`/practice/library/${collection.slug}/questions?paper=${paper.id}`} className="inline-flex items-center text-xs font-semibold text-blue-600">Questions<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></div></article>)}</div></div></main></div>;
}
