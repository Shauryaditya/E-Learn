import { db } from "@/lib/db";
import { chapterKey, cleanChapterTitle } from "@/lib/academic-taxonomy";

export const resolveAcademicChapter = async ({ board, grade, subject, title }: { board: string; grade: string; subject: string; title: string }) => {
  const cleanTitle = cleanChapterTitle(title);
  const slug = chapterKey(cleanTitle);
  const existing = await db.academicChapter.findFirst({
    where: {
      board,
      grade,
      subject,
      syllabusVersion: "CURRENT",
      OR: [{ slug }, { aliases: { some: { normalizedAlias: slug } } }],
    },
  });
  const chapter = existing || await db.academicChapter.create({
    data: { board, grade, subject, syllabusVersion: "CURRENT", slug, title: cleanTitle },
  });
  await db.academicChapterAlias.upsert({
    where: { chapterId_normalizedAlias: { chapterId: chapter.id, normalizedAlias: slug } },
    create: { chapterId: chapter.id, alias: title.trim(), normalizedAlias: slug },
    update: { alias: title.trim() },
  });
  return chapter;
};
