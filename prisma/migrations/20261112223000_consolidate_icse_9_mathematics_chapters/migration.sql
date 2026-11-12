CREATE TEMP TABLE "ChapterMergeMap" (
  "oldTitle" TEXT NOT NULL,
  "targetTitle" TEXT NOT NULL,
  "targetSlug" TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO "ChapterMergeMap" ("oldTitle", "targetTitle", "targetSlug") VALUES
  ('Algebra (Rationalization)', 'Rational and Irrational Numbers', 'rational-and-irrational-numbers'),
  ('Real Numbers (Surds/Radicals)', 'Rational and Irrational Numbers', 'rational-and-irrational-numbers'),
  ('Compound Interest / Growth and Decay', 'Compound Interest', 'compound-interest'),
  ('Compound Interest', 'Compound Interest', 'compound-interest'),
  ('Algebra (Polynomials and Identities)', 'Expansions', 'expansions'),
  ('Polynomials (Algebraic Identities)', 'Expansions', 'expansions'),
  ('Polynomials (Factorization)', 'Factorisation', 'factorisation'),
  ('Polynomials (Factorization, Algebraic Identities)', 'Factorisation', 'factorisation'),
  ('Algebra (Exponents and Rational Expressions)', 'Indices / Exponents', 'indices-and-exponents'),
  ('Exponents and Logarithms', 'Logarithms', 'logarithms'),
  ('Linear Equations in Two Variables', 'Simultaneous Linear Equations in Two Variables', 'simultaneous-linear-equations-in-two-variables'),
  ('Linear Equations in Two Variables (Age Problems)', 'Simultaneous Linear Equations in Two Variables', 'simultaneous-linear-equations-in-two-variables'),
  ('Linear Equations in Two Variables (Boat and Stream Problems)', 'Simultaneous Linear Equations in Two Variables', 'simultaneous-linear-equations-in-two-variables'),
  ('Linear Equations in Two Variables (Cross-Multiplication Method)', 'Simultaneous Linear Equations in Two Variables', 'simultaneous-linear-equations-in-two-variables'),
  ('Linear Equations in Two Variables (Graphical Method)', 'Coordinate Geometry', 'coordinate-geometry'),
  ('Coordinate Geometry (Distance Formula)', 'Coordinate Geometry', 'coordinate-geometry'),
  ('Coordinate Geometry (Properties of Quadrilaterals)', 'Coordinate Geometry', 'coordinate-geometry'),
  ('Geometry (Congruence of Triangles, Midpoint Theorem)', 'Triangles', 'triangles'),
  ('Geometry (Triangles and Inequalities)', 'Triangles', 'triangles'),
  ('Statistics (Frequency Distribution)', 'Statistics', 'statistics'),
  ('Statistics (Histograms, Frequency Polygons)', 'Statistics', 'statistics'),
  ('Statistics (Mean)', 'Statistics', 'statistics'),
  ('Statistics (Median)', 'Statistics', 'statistics');

INSERT INTO "AcademicChapter" ("id", "board", "grade", "subject", "syllabusVersion", "title", "slug", "createdAt", "updatedAt")
SELECT 'chapter_' || md5('ICSE:Class 9:Mathematics:' || map."targetSlug"), 'ICSE', 'Class 9', 'Mathematics', 'CURRENT', map."targetTitle", map."targetSlug", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ChapterMergeMap" map
GROUP BY map."targetTitle", map."targetSlug"
ON CONFLICT ("board", "grade", "subject", "syllabusVersion", "slug") DO UPDATE
SET "title" = EXCLUDED."title", "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "AcademicChapterAlias" ("id", "alias", "normalizedAlias", "chapterId", "createdAt", "updatedAt")
SELECT 'alias_' || md5(target."id" || ':' || source."slug"), source."title", source."slug", target."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ChapterMergeMap" map
JOIN "AcademicChapter" source ON source."board" = 'ICSE' AND source."grade" = 'Class 9' AND source."subject" = 'Mathematics' AND source."title" = map."oldTitle"
JOIN "AcademicChapter" target ON target."board" = 'ICSE' AND target."grade" = 'Class 9' AND target."subject" = 'Mathematics' AND target."syllabusVersion" = 'CURRENT' AND target."slug" = map."targetSlug"
ON CONFLICT ("chapterId", "normalizedAlias") DO UPDATE
SET "alias" = EXCLUDED."alias", "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "ResourceQuestion" question
SET "chapterId" = target."id", "updatedAt" = CURRENT_TIMESTAMP
FROM "AcademicChapter" source
JOIN "ChapterMergeMap" map ON map."oldTitle" = source."title"
JOIN "AcademicChapter" target ON target."board" = 'ICSE' AND target."grade" = 'Class 9' AND target."subject" = 'Mathematics' AND target."syllabusVersion" = 'CURRENT' AND target."slug" = map."targetSlug"
WHERE question."chapterId" = source."id" AND source."board" = 'ICSE' AND source."grade" = 'Class 9' AND source."subject" = 'Mathematics';

DELETE FROM "AcademicChapterAlias" alias
USING "AcademicChapter" chapter
WHERE alias."chapterId" = chapter."id" AND chapter."board" = 'ICSE' AND chapter."grade" = 'Class 9' AND chapter."subject" = 'Mathematics'
  AND NOT EXISTS (SELECT 1 FROM "ResourceQuestion" question WHERE question."chapterId" = chapter."id")
  AND NOT EXISTS (SELECT 1 FROM "Chapter" learning WHERE learning."academicChapterId" = chapter."id")
  AND NOT EXISTS (SELECT 1 FROM "TestChapter" test WHERE test."academicChapterId" = chapter."id");

DELETE FROM "AcademicChapter" chapter
WHERE chapter."board" = 'ICSE' AND chapter."grade" = 'Class 9' AND chapter."subject" = 'Mathematics'
  AND NOT EXISTS (SELECT 1 FROM "ResourceQuestion" question WHERE question."chapterId" = chapter."id")
  AND NOT EXISTS (SELECT 1 FROM "Chapter" learning WHERE learning."academicChapterId" = chapter."id")
  AND NOT EXISTS (SELECT 1 FROM "TestChapter" test WHERE test."academicChapterId" = chapter."id");
