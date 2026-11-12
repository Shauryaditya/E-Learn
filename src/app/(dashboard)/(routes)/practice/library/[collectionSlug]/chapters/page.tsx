import { auth } from "@clerk/nextjs";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPracticeCollection } from "@/actions/get-practice-collections";
import { CollectionHeader } from "../_components/collection-header";

export default async function CollectionChaptersPage({ params }: { params: { collectionSlug: string } }) {
  const { userId } = auth();
  if (!userId) redirect("/");
  const collection = await getPracticeCollection(params.collectionSlug, userId); if (!collection) notFound();
  return <div className="min-h-full bg-background"><CollectionHeader collection={collection} title="Chapter-wise questions" description="Practice the extracted papers one chapter at a time" /><main className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><div className="overflow-hidden rounded-lg border bg-card"><div className="hidden grid-cols-[1fr_140px_28px] border-b bg-muted/40 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid"><span>Chapter</span><span>Questions</span><span /></div><div className="divide-y">{collection.chapters.map((chapter, index) => <Link key={chapter.slug} href={`/practice/library/${collection.slug}/questions?chapter=${chapter.slug}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 hover:bg-muted/40 sm:grid-cols-[1fr_140px_28px] sm:px-5"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded border bg-muted/50 text-xs font-semibold text-muted-foreground sm:hidden">{index + 1}</span><span className="text-sm font-semibold">{chapter.title}</span></div><span className="flex items-center gap-2 text-xs text-muted-foreground"><BookOpen className="h-3.5 w-3.5" />{chapter.questionCount}</span><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div></div></main></div>;
}
