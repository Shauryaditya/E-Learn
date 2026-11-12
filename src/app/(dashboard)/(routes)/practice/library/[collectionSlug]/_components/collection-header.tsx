import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PracticeCollection } from "@/lib/practice-catalog";

export const CollectionHeader = ({ collection, title, description }: { collection: PracticeCollection; title: string; description: string }) => <header className="border-b bg-card"><div className="mx-auto max-w-6xl px-4 py-3 md:py-5 sm:px-6">
  <Link href="/practice" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /><span className="md:hidden">Practice</span><span className="hidden md:inline">Back to all collections</span></Link>
  <div className="mt-2 flex items-start justify-between gap-3 md:block"><div className="min-w-0"><div className="hidden flex-wrap gap-1.5 md:flex"><Badge variant="outline">{collection.board}</Badge><Badge variant="secondary">{collection.grade}</Badge><Badge variant="secondary">{collection.subject}</Badge></div><h1 className="truncate text-lg font-bold tracking-tight md:mt-3 md:text-2xl">{title}</h1><p className="mt-0.5 truncate text-xs text-muted-foreground md:mt-1 md:text-sm">{collection.school} · {description}</p></div><Badge variant="secondary" className="shrink-0 md:hidden">{collection.questionCount} Q</Badge></div>
  {!!collection.attemptedCount && <div className="mt-3 hidden flex-wrap gap-2 text-xs md:flex"><Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{collection.solvedCount || 0} solved</Badge><Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">{collection.needsReviewCount || 0} need revision</Badge></div>}
  <nav className="mt-3 flex gap-5 overflow-x-auto text-xs font-medium md:mt-5 md:text-sm"><Link className="pb-2 hover:text-blue-600" href={`/practice/library/${collection.slug}/papers`}>Papers</Link><Link className="pb-2 hover:text-blue-600" href={`/practice/library/${collection.slug}/questions`}>Questions</Link><Link className="pb-2 hover:text-blue-600" href={`/practice/library/${collection.slug}/chapters`}>Chapters</Link></nav>
</div></header>;
