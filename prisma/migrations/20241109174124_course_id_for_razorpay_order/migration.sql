/*
  Warnings:

  - Added the required column `courseId` to the `RazorpayOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RazorpayOrder" ADD COLUMN     "courseId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "RazorpayOrder_courseId_idx" ON "RazorpayOrder"("courseId");
