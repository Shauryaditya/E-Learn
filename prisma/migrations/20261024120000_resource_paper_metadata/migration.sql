ALTER TYPE "ResourceCategory" ADD VALUE 'SCHOOL' BEFORE 'BOARD';

ALTER TABLE "Resource"
ADD COLUMN "schoolName" TEXT,
ADD COLUMN "board" TEXT,
ADD COLUMN "examType" TEXT;

CREATE INDEX "Resource_schoolName_idx" ON "Resource"("schoolName");
CREATE INDEX "Resource_board_idx" ON "Resource"("board");
CREATE INDEX "Resource_year_idx" ON "Resource"("year");
