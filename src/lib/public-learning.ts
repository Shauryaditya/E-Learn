import { db } from "@/lib/db";

export const SITE_URL = "https://elearn.aaccent.in";

export const publicSlug = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

const publicQuestionWhere = {
  isPublished: true,
  resource: { isPublished: true },
} as const;

export type PublicChapterSummary = {
  id: string;
  slug: string;
  title: string;
  questionCount: number;
  paperCount: number;
};

export type PublicSubjectHub = {
  board: string;
  grade: string;
  subject: string;
  boardSlug: string;
  gradeSlug: string;
  subjectSlug: string;
  questionCount: number;
  paperCount: number;
  chapters: PublicChapterSummary[];
};

export const publicHubHref = (hub: Pick<PublicSubjectHub, "boardSlug" | "gradeSlug" | "subjectSlug">) =>
  `/learn/${hub.boardSlug}/${hub.gradeSlug}/${hub.subjectSlug}`;

export const getPublicLearningCatalog = async (): Promise<PublicSubjectHub[]> => {
  const chapters = await db.academicChapter.findMany({
    where: { questions: { some: publicQuestionWhere } },
    select: {
      id: true,
      board: true,
      grade: true,
      subject: true,
      slug: true,
      title: true,
      questions: {
        where: publicQuestionWhere,
        select: { id: true, resourceId: true },
      },
    },
    orderBy: [{ board: "asc" }, { grade: "asc" }, { subject: "asc" }, { title: "asc" }],
  });

  const groups = new Map<string, PublicSubjectHub & { paperIds: Set<string> }>();
  for (const chapter of chapters) {
    const key = `${chapter.board}|${chapter.grade}|${chapter.subject}`;
    const current = groups.get(key) || {
      board: chapter.board,
      grade: chapter.grade,
      subject: chapter.subject,
      boardSlug: publicSlug(chapter.board),
      gradeSlug: publicSlug(chapter.grade),
      subjectSlug: publicSlug(chapter.subject),
      questionCount: 0,
      paperCount: 0,
      chapters: [],
      paperIds: new Set<string>(),
    };
    const chapterPaperIds = new Set(chapter.questions.map((question) => question.resourceId));
    chapter.questions.forEach((question) => current.paperIds.add(question.resourceId));
    current.questionCount += chapter.questions.length;
    current.chapters.push({
      id: chapter.id,
      slug: chapter.slug,
      title: chapter.title,
      questionCount: chapter.questions.length,
      paperCount: chapterPaperIds.size,
    });
    groups.set(key, current);
  }

  return Array.from(groups.values()).map(({ paperIds, ...hub }) => ({
    ...hub,
    paperCount: paperIds.size,
  }));
};

export const getPublicSubjectHub = async (boardSlug: string, gradeSlug: string, subjectSlug: string) =>
  (await getPublicLearningCatalog()).find((hub) =>
    hub.boardSlug === boardSlug && hub.gradeSlug === gradeSlug && hub.subjectSlug === subjectSlug
  ) || null;

export const getPublicChapter = async (boardSlug: string, gradeSlug: string, subjectSlug: string, chapterSlug: string) => {
  const hub = await getPublicSubjectHub(boardSlug, gradeSlug, subjectSlug);
  const chapter = hub?.chapters.find((item) => item.slug === chapterSlug);
  if (!hub || !chapter) return null;

  const questions = await db.resourceQuestion.findMany({
    where: { chapterId: chapter.id, ...publicQuestionWhere },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      marks: true,
      answer: true,
      solution: true,
      formula: true,
      sourcePage: true,
      resource: {
        select: { title: true, year: true, schoolName: true, board: true, examType: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { position: "asc" }],
    take: 20,
  });

  return { hub, chapter, questions };
};
