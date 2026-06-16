-- CreateTable
CREATE TABLE "StudyActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "secondsStudied" INTEGER NOT NULL DEFAULT 0,
    "heartbeatCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudyActivity_userId_date_key" ON "StudyActivity"("userId", "date");

-- CreateIndex
CREATE INDEX "StudyActivity_userId_idx" ON "StudyActivity"("userId");

-- CreateIndex
CREATE INDEX "StudyActivity_date_idx" ON "StudyActivity"("date");
