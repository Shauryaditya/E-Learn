import { auth } from "@clerk/nextjs";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { normalizeBoard, normalizeGrade, normalizeSubject } from "@/lib/academic-taxonomy";
import { ResourceQuestionManager } from "./_components/resource-question-manager";
import { ResourceMetadataForm } from "./_components/resource-metadata-form";

export default async function TeacherResourcePage({ params }: { params: { resourceId: string } }) {
  const { userId } = auth(); if (!userId || !isTeacher(userId)) redirect("/");
  const resource = await db.resource.findUnique({ where: { id: params.resourceId }, include: { questions: { include: { chapter: true }, orderBy: { position: "asc" } } } });
  if (!resource) notFound();
  const scope = resource.board && resource.grade ? { board: normalizeBoard(resource.board), grade: normalizeGrade(resource.grade), subject: normalizeSubject(resource.subject) } : null;
  const availableChapters = scope ? await db.academicChapter.findMany({ where: { ...scope, syllabusVersion: "CURRENT" }, orderBy: { title: "asc" }, select: { id: true, title: true } }) : [];
  return <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="border-b pb-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/teacher/resources" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Paper manager</Link><h1 className="text-2xl font-bold">{resource.title}</h1><p className="mt-1 text-sm text-muted-foreground">{[resource.schoolName || "Board paper", resource.board, resource.grade, resource.subject, resource.year].filter(Boolean).join(" · ")}</p></div><Button asChild variant="outline"><Link href={resource.url} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Download original</Link></Button></div></header>
    <ResourceMetadataForm resourceId={resource.id} initialData={{ title: resource.title, board: scope?.board || resource.board || "", grade: scope?.grade || resource.grade || "", subject: scope?.subject || resource.subject, schoolName: resource.schoolName || "", examType: resource.examType || "", year: resource.year, category: resource.category }} />
    <ResourceQuestionManager resourceId={resource.id} originalUrl={resource.url} existingQuestions={resource.questions.map(question => ({ id: question.id, questionText: question.questionText, questionType: question.questionType, defaultMarks: question.marks, chapterTitle: question.chapter?.title || "Unclassified", answer: question.answer || "", explanation: question.solution || "", formula: question.formula || "", sourcePage: question.sourcePage, options: Array.isArray(question.options) ? question.options as { optionText: string; isCorrect: boolean }[] : [] }))} isPublished={resource.isPublished} scope={scope} availableChapters={availableChapters} />
  </div>;
}
