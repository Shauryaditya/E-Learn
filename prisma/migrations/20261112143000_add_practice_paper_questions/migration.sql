ALTER TABLE "Resource"
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AcademicChapter" (
    "id" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicChapter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResourceQuestion" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "answer" TEXT,
    "solution" TEXT,
    "formula" TEXT,
    "options" JSONB,
    "position" INTEGER NOT NULL,
    "sourcePage" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "resourceId" TEXT NOT NULL,
    "chapterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResourceQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicChapter_board_grade_subject_slug_key" ON "AcademicChapter"("board", "grade", "subject", "slug");
CREATE INDEX "AcademicChapter_board_grade_subject_idx" ON "AcademicChapter"("board", "grade", "subject");
CREATE UNIQUE INDEX "ResourceQuestion_resourceId_position_key" ON "ResourceQuestion"("resourceId", "position");
CREATE INDEX "ResourceQuestion_resourceId_isPublished_idx" ON "ResourceQuestion"("resourceId", "isPublished");
CREATE INDEX "ResourceQuestion_chapterId_idx" ON "ResourceQuestion"("chapterId");
