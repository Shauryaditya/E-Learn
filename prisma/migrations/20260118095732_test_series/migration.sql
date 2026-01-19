/*
  Warnings:

  - You are about to drop the column `testId` on the `TestSubmission` table. All the data in the column will be lost.
  - Added the required column `testChapterId` to the `TestSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TestSubmission_testId_idx";

-- AlterTable
ALTER TABLE "TestSubmission" DROP COLUMN "testId",
ADD COLUMN     "testChapterId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TestSubmission_testChapterId_idx" ON "TestSubmission"("testChapterId");
