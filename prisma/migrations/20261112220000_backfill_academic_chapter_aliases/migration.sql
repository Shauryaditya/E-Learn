INSERT INTO "AcademicChapterAlias" ("id", "alias", "normalizedAlias", "chapterId", "createdAt", "updatedAt")
SELECT
  'alias_' || md5("id" || ':' || "slug"),
  "title",
  "slug",
  "id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AcademicChapter"
ON CONFLICT ("chapterId", "normalizedAlias") DO NOTHING;
