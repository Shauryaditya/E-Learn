import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PracticeCollection } from "@/lib/practice-catalog";

export const CollectionHeader = ({ collection, title, description }: { collection: PracticeCollection; title: string; description: string }) => <header className="border-b bg-card"><div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
  <Link href="/practice" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Back to all collections</Link>
  <div className="flex flex-wrap gap-1.5"><Badge variant="outline">{collection.board}</Badge><Badge variant="secondary">{collection.grade}</Badge><Badge variant="secondary">{collection.subject}</Badge></div>
  <h1 className="mt-3 text-2xl font-bold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{collection.school} · {description}</p>
  <nav className="mt-5 flex gap-5 overflow-x-auto text-sm font-medium"><Link className="pb-2 hover:text-blue-600" href={`/practice/library/${collection.slug}/papers`}>{collection.paperCount} Papers</Link><Link className="pb-2 hover:text-blue-600" href={`/practice/library/${collection.slug}/questions`}>{collection.questionCount} Questions</Link><Link className="pb-2 hover:text-blue-600" href={`/practice/library/${collection.slug}/chapters`}>{collection.chapterCount} Chapters</Link></nav>
</div></header>;
