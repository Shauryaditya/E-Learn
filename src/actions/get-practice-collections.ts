import { ResourceCategory, ResourceType } from "@prisma/client";
import { db } from "@/lib/db";
import { PracticeCollection, PracticeQuestion } from "@/lib/practice-catalog";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const makeSlug = (board: string, grade: string, subject: string, school: string) => [board, grade, subject, school].map(slugify).join("--");
const displayType = (value: string): PracticeQuestion["type"] => value.includes("LONG") ? "Long answer" : value === "NUMERICAL" ? "Numerical" : "Short answer";

export const getPracticeCollections = async (): Promise<PracticeCollection[]> => {
  const resources = await db.resource.findMany({
    where: { isPublished: true, type: { in: [ResourceType.PAST_PAPER, ResourceType.SAMPLE_PAPER] }, board: { not: null }, grade: { not: null } },
    include: { questions: { where: { isPublished: true }, include: { chapter: true }, orderBy: { position: "asc" } } },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
  const groups = new Map<string, PracticeCollection>();
  for (const resource of resources) {
    const board = resource.board!; const grade = resource.grade!;
    const school = resource.category === ResourceCategory.BOARD ? `${board} Board Papers` : resource.schoolName || "School papers";
    const slug = makeSlug(board, grade, resource.subject, school);
    const item = groups.get(slug) || { slug, board: board as PracticeCollection["board"], grade: grade as PracticeCollection["grade"], subject: resource.subject, school, source: resource.category === ResourceCategory.BOARD ? "Board papers" as const : "School papers" as const, paperCount: 0, questionCount: 0, chapterCount: 0, papers: [], chapters: [], questions: [] };
    item.papers.push({ id: resource.id, title: resource.title, year: resource.year || resource.createdAt.getFullYear(), exam: resource.examType || "Question paper", questionCount: resource.questions.length, url: resource.url });
    item.paperCount += 1; item.questionCount += resource.questions.length;
    for (const question of resource.questions) {
      const chapterSlug = question.chapter?.slug || "unclassified"; const found = item.chapters.find(chapter => chapter.slug === chapterSlug);
      if (found) found.questionCount += 1; else item.chapters.push({ slug: chapterSlug, title: question.chapter?.title || "Unclassified", questionCount: 1 });
      item.questions.push({ id: question.id, paperId: resource.id, chapterSlug, year: resource.year || resource.createdAt.getFullYear(), school, exam: resource.examType || "Question paper", marks: question.marks, type: displayType(question.questionType), question: question.questionText, formula: question.formula || undefined, answer: question.answer || "Answer not supplied", solution: question.solution || "A reviewed solution has not been added yet." });
    }
    item.chapterCount = item.chapters.length; groups.set(slug, item);
  }
  return Array.from(groups.values()).sort((a, b) => a.board.localeCompare(b.board) || a.grade.localeCompare(b.grade) || a.subject.localeCompare(b.subject));
};

export const getPracticeCollection = async (slug: string) => (await getPracticeCollections()).find(item => item.slug === slug);
