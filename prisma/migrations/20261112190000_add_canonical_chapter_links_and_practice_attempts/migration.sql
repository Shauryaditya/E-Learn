ALTER TABLE "AcademicChapter"
ADD COLUMN "syllabusVersion" TEXT NOT NULL DEFAULT 'CURRENT';

ALTER TABLE "Chapter"
ADD COLUMN "academicChapterId" TEXT;

ALTER TABLE "TestChapter"
ADD COLUMN "academicChapterId" TEXT;

CREATE TABLE "AcademicChapterAlias" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicChapterAlias_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "PracticeAttemptStatus" AS ENUM ('SOLVED', 'NEEDS_REVIEW');

CREATE TABLE "PracticeQuestionAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PracticeAttemptStatus" NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeQuestionAttempt_pkey" PRIMARY KEY ("id")
);

DROP INDEX "AcademicChapter_board_grade_subject_slug_key";
DROP INDEX "AcademicChapter_board_grade_subject_idx";

CREATE UNIQUE INDEX "AcademicChapter_board_grade_subject_syllabusVersion_slug_key" ON "AcademicChapter"("board", "grade", "subject", "syllabusVersion", "slug");
CREATE INDEX "AcademicChapter_board_grade_subject_syllabusVersion_idx" ON "AcademicChapter"("board", "grade", "subject", "syllabusVersion");
CREATE UNIQUE INDEX "AcademicChapterAlias_chapterId_normalizedAlias_key" ON "AcademicChapterAlias"("chapterId", "normalizedAlias");
CREATE INDEX "AcademicChapterAlias_normalizedAlias_idx" ON "AcademicChapterAlias"("normalizedAlias");
CREATE UNIQUE INDEX "PracticeQuestionAttempt_userId_questionId_key" ON "PracticeQuestionAttempt"("userId", "questionId");
CREATE INDEX "PracticeQuestionAttempt_userId_status_idx" ON "PracticeQuestionAttempt"("userId", "status");
CREATE INDEX "PracticeQuestionAttempt_questionId_idx" ON "PracticeQuestionAttempt"("questionId");
CREATE INDEX "Chapter_academicChapterId_idx" ON "Chapter"("academicChapterId");
CREATE INDEX "TestChapter_academicChapterId_idx" ON "TestChapter"("academicChapterId");
