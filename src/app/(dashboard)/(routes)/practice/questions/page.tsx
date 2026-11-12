import { auth } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getPracticeCollections } from "@/actions/get-practice-collections";
import { Badge } from "@/components/ui/badge";
import { QuestionList } from "../[subjectSlug]/[chapterSlug]/_components/question-list";

export default async function PracticeQuestionsPage({ searchParams }: { searchParams: { board?: string; grade?: string; subject?: string; chapter?: string; status?: "SOLVED" | "NEEDS_REVIEW" } }) {
  const { userId } = auth();
  if (!userId) redirect("/");
  const collections = await getPracticeCollections(userId);
  const matching = collections.filter((item) => (!searchParams.board || item.board === searchParams.board) && (!searchParams.grade || item.grade === searchParams.grade) && (!searchParams.subject || item.subject === searchParams.subject));
  const seen = new Set<string>();
  const questions = matching.flatMap((item) => item.questions).filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return (!searchParams.chapter || question.chapterSlug === searchParams.chapter) && (!searchParams.status || question.attemptStatus === searchParams.status);
  });
  const chapter = matching.flatMap((item) => item.chapters).find((item) => item.slug === searchParams.chapter);
  const title = searchParams.status === "NEEDS_REVIEW" ? "Needs revision" : chapter?.title || searchParams.subject || "Practice questions";
  const context = [searchParams.grade, searchParams.board, searchParams.subject].filter(Boolean).join(" · ");

  return <div className="min-h-full bg-background"><header className="border-b bg-card"><div className="mx-auto max-w-6xl px-4 py-3 md:px-6 md:py-5"><Link href="/practice" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Practice</Link><div className="mt-2 flex items-start justify-between gap-3"><div className="min-w-0"><h1 className="truncate text-lg font-bold md:text-2xl">{title}</h1><p className="mt-0.5 truncate text-xs text-muted-foreground md:text-sm">{context}</p></div><Badge variant="secondary" className="shrink-0">{questions.length} questions</Badge></div></div></header><main className="mx-auto max-w-6xl px-3 py-3 pb-24 sm:px-6 md:py-6"><QuestionList questions={questions} compact /></main></div>;
}
