import { auth } from "@clerk/nextjs";
import { notFound, redirect } from "next/navigation";
import { getPracticeCollection } from "@/actions/get-practice-collections";
import { QuestionList } from "../../../[subjectSlug]/[chapterSlug]/_components/question-list";
import { CollectionHeader } from "../_components/collection-header";

export default async function CollectionQuestionsPage({ params, searchParams }: { params: { collectionSlug: string }; searchParams: { chapter?: string; paper?: string } }) {
  const { userId } = auth();
  if (!userId) redirect("/");
  const collection = await getPracticeCollection(params.collectionSlug, userId); if (!collection) notFound();
  const chapter = collection.chapters.find(item => item.slug === searchParams.chapter);
  const paper = collection.papers.find(item => item.id === searchParams.paper);
  const context = chapter ? `${chapter.title} · questions from all available papers` : paper ? `${paper.title} · ${paper.year}` : "All extracted questions from this collection";
  const questions = chapter ? collection.questions.filter(item => item.chapterSlug === chapter.slug) : paper ? collection.questions.filter(item => item.paperId === paper.id) : collection.questions;
  return <div className="min-h-full bg-background"><CollectionHeader collection={collection} title={chapter?.title || paper?.title || "Question bank"} description={context} /><main className="mx-auto max-w-6xl px-3 py-3 pb-24 sm:px-6 md:py-6"><QuestionList questions={questions} /></main></div>;
}
