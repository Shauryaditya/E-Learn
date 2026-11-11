CREATE TYPE "StudyPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "weeklyMinutes" INTEGER NOT NULL,
    "subjects" JSONB NOT NULL,
    "roadmap" JSONB NOT NULL,
    "status" "StudyPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudyPlan_userId_key" ON "StudyPlan"("userId");
CREATE INDEX "StudyPlan_userId_status_idx" ON "StudyPlan"("userId", "status");
CREATE INDEX "StudyPlan_examDate_idx" ON "StudyPlan"("examDate");
