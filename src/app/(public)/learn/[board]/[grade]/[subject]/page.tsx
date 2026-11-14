import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileQuestion, Files, Home } from "lucide-react";
import { notFound } from "next/navigation";

import { getPublicSubjectHub, publicHubHref, SITE_URL } from "@/lib/public-learning";

export const dynamic = "force-dynamic";

type PageProps = { params: { board: string; grade: string; subject: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const hub = await getPublicSubjectHub(params.board, params.grade, params.subject);
  if (!hub) return { title: "Learning resources not found" };
  const href = publicHubHref(hub);
  return {
    title: `${hub.board} ${hub.grade} ${hub.subject} Questions | Aaccent E-Learn`,
    description: `Practice ${hub.questionCount} ${hub.board} ${hub.grade} ${hub.subject} questions across ${hub.chapters.length} chapters from school and previous-year papers.`,
    alternates: { canonical: href },
    openGraph: { title: `${hub.board} ${hub.grade} ${hub.subject} Questions`, description: `Chapter-wise practice from ${hub.paperCount} published papers.`, url: href, type: "website" },
  };
}

export default async function PublicSubjectPage({ params }: PageProps) {
  const hub = await getPublicSubjectHub(params.board, params.grade, params.subject);
  if (!hub) notFound();
  const href = publicHubHref(hub);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Learning resources", item: `${SITE_URL}/learn` },
      { "@type": "ListItem", position: 2, name: `${hub.board} ${hub.grade} ${hub.subject}`, item: `${SITE_URL}${href}` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      <section className="border-b bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500"><Link href="/learn" className="inline-flex items-center gap-1 hover:text-blue-600"><Home className="h-3 w-3" />Learning resources</Link><span>/</span><span>{hub.board} {hub.grade}</span></nav>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">{hub.board} · {hub.grade}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{hub.subject} chapter-wise questions</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Practise questions collected from published school and previous-year papers. Choose a chapter to view source information, marks and available answers.</p>
          <div className="mt-7 grid max-w-xl grid-cols-3 gap-3"><Metric icon={BookOpen} value={hub.chapters.length} label="Chapters" /><Metric icon={FileQuestion} value={hub.questionCount} label="Questions" /><Metric icon={Files} value={hub.paperCount} label="Papers" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-5"><h2 className="text-xl font-bold">Choose a chapter</h2><p className="mt-1 text-sm text-slate-500">Coverage grows automatically as reviewed papers are published.</p></div>
        <div className="overflow-hidden rounded-xl border bg-white dark:border-white/10 dark:bg-white/[0.025]">
          <div className="divide-y dark:divide-white/10">{hub.chapters.map((chapter, index) => (
            <Link key={chapter.id} href={`${href}/${chapter.slug}`} className="group flex items-center gap-3 px-4 py-4 transition hover:bg-blue-50/60 dark:hover:bg-blue-950/20 sm:px-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 dark:bg-white/5">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300">{chapter.title}</h2><p className="mt-1 text-xs text-slate-500">{chapter.questionCount} questions · {chapter.paperCount} source {chapter.paperCount === 1 ? "paper" : "papers"}</p></div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </Link>
          ))}</div>
        </div>
        <div className="mt-8 rounded-xl bg-slate-950 p-5 text-white sm:flex sm:items-center sm:justify-between sm:p-6"><div><h2 className="font-bold">Want to track what you have solved?</h2><p className="mt-1 text-sm text-slate-300">Create a free account to save progress and add difficult questions to revision.</p></div><Link href="/sign-up" className="mt-4 inline-flex h-10 items-center rounded-md bg-white px-4 text-xs font-semibold text-slate-950 sm:mt-0">Create free account <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></div>
      </section>
    </main>
  );
}

const Metric = ({ icon: Icon, value, label }: { icon: typeof BookOpen; value: number; label: string }) => <div className="rounded-lg border bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"><Icon className="h-4 w-4 text-blue-600" /><p className="mt-2 text-lg font-bold">{value.toLocaleString("en-IN")}</p><p className="text-[11px] text-slate-500">{label}</p></div>;
