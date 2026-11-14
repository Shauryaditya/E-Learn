import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileQuestion, Files } from "lucide-react";

import { getPublicLearningCatalog, publicHubHref } from "@/lib/public-learning";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Chapter-wise Questions for Classes 8–12 | Aaccent E-Learn",
  description: "Browse chapter-wise questions from school and board papers for CBSE, ICSE, ISC and Madhyamik students in Classes 8–12.",
  alternates: { canonical: "/learn" },
};

export default async function LearningDirectoryPage() {
  const hubs = await getPublicLearningCatalog();
  const boards = Array.from(new Set(hubs.map((hub) => hub.board)));
  const questionCount = hubs.reduce((total, hub) => total + hub.questionCount, 0);
  const chapterCount = hubs.reduce((total, hub) => total + hub.chapters.length, 0);

  return (
    <main>
      <section className="border-b bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">Free learning library</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Practice school and board questions chapter by chapter.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Explore questions extracted from previous school papers and organised by board, class, subject and chapter. Create an account only when you want to save progress.</p>
          <div className="mt-7 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">{boards.map((board) => <span key={board} className="rounded-full border bg-slate-50 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">{board}</span>)}</div>
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <Stat label="Subjects" value={hubs.length} icon={BookOpen} />
            <Stat label="Chapters" value={chapterCount} icon={Files} />
            <Stat label="Questions" value={questionCount} icon={FileQuestion} />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-5"><h2 className="text-xl font-bold">Available subjects</h2><p className="mt-1 text-sm text-slate-500">Only subjects with published questions are shown.</p></div>
        {hubs.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{hubs.map((hub) => (
          <Link key={`${hub.board}-${hub.grade}-${hub.subject}`} href={publicHubHref(hub)} className="group rounded-xl border bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-blue-800 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">{hub.board} · {hub.grade}</p><h2 className="mt-2 text-base font-bold">{hub.subject}</h2></div><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" /></div>
            <div className="mt-5 flex gap-4 text-xs text-slate-500"><span><strong className="text-slate-950 dark:text-white">{hub.chapters.length}</strong> chapters</span><span><strong className="text-slate-950 dark:text-white">{hub.questionCount}</strong> questions</span><span><strong className="text-slate-950 dark:text-white">{hub.paperCount}</strong> papers</span></div>
          </Link>
        ))}</div> : <div className="rounded-xl border border-dashed bg-white px-5 py-12 text-center dark:border-white/10 dark:bg-white/[0.025]"><p className="font-semibold">Published learning pages are being prepared.</p><p className="mt-1 text-sm text-slate-500">Please check back as new school papers are reviewed and published.</p></div>}
      </section>
    </main>
  );
}

const Stat = ({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BookOpen }) => <div className="rounded-lg border bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"><Icon className="h-4 w-4 text-blue-600" /><dd className="mt-2 text-lg font-bold">{value.toLocaleString("en-IN")}</dd><dt className="text-[11px] text-slate-500">{label}</dt></div>;
