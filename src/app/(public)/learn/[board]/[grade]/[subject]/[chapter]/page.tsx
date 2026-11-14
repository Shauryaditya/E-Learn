import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown, FileQuestion, Home } from "lucide-react";
import { notFound } from "next/navigation";

import { MathText } from "@/components/math-text";
import { getPublicChapter, publicHubHref, SITE_URL } from "@/lib/public-learning";

export const dynamic = "force-dynamic";

type PageProps = { params: { board: string; grade: string; subject: string; chapter: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getPublicChapter(params.board, params.grade, params.subject, params.chapter);
  if (!data) return { title: "Chapter not found" };
  const hubHref = publicHubHref(data.hub);
  const href = `${hubHref}/${data.chapter.slug}`;
  return {
    title: `${data.chapter.title} Questions – ${data.hub.board} ${data.hub.grade} ${data.hub.subject}`,
    description: `Practise ${data.chapter.questionCount} ${data.chapter.title} questions from school and previous-year ${data.hub.board} ${data.hub.grade} ${data.hub.subject} papers.`,
    alternates: { canonical: href },
    openGraph: { title: `${data.chapter.title} Questions and Answers`, description: `${data.chapter.questionCount} chapter-wise questions from ${data.chapter.paperCount} published papers.`, url: href, type: "article" },
  };
}

export default async function PublicChapterPage({ params }: PageProps) {
  const data = await getPublicChapter(params.board, params.grade, params.subject, params.chapter);
  if (!data) notFound();
  const { hub, chapter, questions } = data;
  const hubHref = publicHubHref(hub);
  const href = `${hubHref}/${chapter.slug}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Learning resources", item: `${SITE_URL}/learn` },
        { "@type": "ListItem", position: 2, name: `${hub.board} ${hub.grade} ${hub.subject}`, item: `${SITE_URL}${hubHref}` },
        { "@type": "ListItem", position: 3, name: chapter.title, item: `${SITE_URL}${href}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: `${chapter.title} questions`,
      description: `${chapter.questionCount} questions for ${hub.board} ${hub.grade} ${hub.subject}.`,
      educationalLevel: hub.grade,
      about: [hub.subject, chapter.title],
      provider: { "@type": "Organization", name: "Aaccent E-Learn", url: SITE_URL },
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <section className="border-b bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link href="/learn" className="inline-flex items-center gap-1 hover:text-blue-600"><Home className="h-3 w-3" />Resources</Link><span>/</span><Link href={hubHref} className="hover:text-blue-600">{hub.subject}</Link><span>/</span><span>{chapter.title}</span></nav>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">{hub.board} · {hub.grade} · {hub.subject}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{chapter.title} questions and answers</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Previous school-paper questions arranged for focused chapter practice. Sources, years and marks are shown wherever available.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full border bg-slate-50 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">{chapter.questionCount} questions</span><span className="rounded-full border bg-slate-50 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">{chapter.paperCount} papers</span></div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Practice questions</h2><p className="mt-1 text-sm text-slate-500">Showing up to 20 recently published questions.</p></div><FileQuestion className="h-5 w-5 text-blue-600" /></div>
        <div className="space-y-3">{questions.map((question, index) => {
          const source = [question.resource.year, question.resource.schoolName || question.resource.board, question.resource.examType].filter(Boolean).join(" · ");
          const hasAnswer = Boolean(question.answer?.trim() || question.solution?.trim());
          return <article key={question.id} className="overflow-hidden rounded-xl border bg-white dark:border-white/10 dark:bg-white/[0.025]">
            <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500 dark:border-white/10 dark:bg-white/[0.03]"><strong className="text-slate-950 dark:text-white">Q{index + 1}</strong><span className="truncate">{source || question.resource.title}</span><span className="ml-auto shrink-0">{question.marks} {question.marks === 1 ? "mark" : "marks"}</span></div>
            <div className="p-4 sm:p-5"><MathText value={question.questionText} className="block max-w-full break-words text-sm font-medium leading-7 sm:text-[15px]" />{question.formula && <div className="mt-3 max-w-full overflow-x-auto rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-white/5"><MathText value={question.formula} forceMath /></div>}
              {hasAnswer ? <details className="group mt-4 rounded-lg border bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]"><summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-semibold">Show answer <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></summary><div className="border-t px-3 py-3 text-sm leading-6 dark:border-white/10">{question.answer && <MathText value={question.answer} className="block font-medium" />}{question.solution && <MathText value={question.solution} className="mt-2 block text-slate-600 dark:text-slate-300" />}</div></details> : <p className="mt-4 text-xs text-amber-700 dark:text-amber-400">A reviewed answer has not been added yet.</p>}
            </div>
          </article>;
        })}</div>
        <div className="mt-8 rounded-xl bg-blue-600 p-5 text-white sm:flex sm:items-center sm:justify-between sm:p-6"><div><h2 className="font-bold">Continue in the practice workspace</h2><p className="mt-1 text-sm text-blue-100">Save solved questions, build a revision list and connect chapters to your study planner.</p></div><Link href="/sign-up" className="mt-4 inline-flex h-10 items-center rounded-md bg-white px-4 text-xs font-semibold text-blue-700 sm:mt-0">Start practising <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></div>
      </section>
    </main>
  );
}
