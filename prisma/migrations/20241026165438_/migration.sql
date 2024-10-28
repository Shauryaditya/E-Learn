-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "chapterId" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Attachment_chapterId_idx" ON "Attachment"("chapterId");
