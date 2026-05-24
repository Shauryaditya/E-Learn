-- CreateEnum
CREATE TYPE "ContestRegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "ContestAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED');

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "registrationOpensAt" TIMESTAMP(3),
    "registrationClosesAt" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "defaultMarks" DOUBLE PRECISION NOT NULL,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBankOption" (
    "id" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBankOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestQuestion" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "marks" DOUBLE PRECISION,
    "contestId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ContestRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "contestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ContestAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "contestId" TEXT NOT NULL,
    "registrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestAnswer" (
    "id" TEXT NOT NULL,
    "selectedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "marksAwarded" DOUBLE PRECISION,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contest_userId_idx" ON "Contest"("userId");

-- CreateIndex
CREATE INDEX "Contest_categoryId_idx" ON "Contest"("categoryId");

-- CreateIndex
CREATE INDEX "Contest_startsAt_idx" ON "Contest"("startsAt");

-- CreateIndex
CREATE INDEX "Contest_isPublished_idx" ON "Contest"("isPublished");

-- CreateIndex
CREATE INDEX "QuestionBank_userId_idx" ON "QuestionBank"("userId");

-- CreateIndex
CREATE INDEX "QuestionBank_questionType_idx" ON "QuestionBank"("questionType");

-- CreateIndex
CREATE INDEX "QuestionBankOption_questionId_idx" ON "QuestionBankOption"("questionId");

-- CreateIndex
CREATE INDEX "ContestQuestion_questionId_idx" ON "ContestQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestQuestion_contestId_questionId_key" ON "ContestQuestion"("contestId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestQuestion_contestId_position_key" ON "ContestQuestion"("contestId", "position");

-- CreateIndex
CREATE INDEX "ContestRegistration_contestId_idx" ON "ContestRegistration"("contestId");

-- CreateIndex
CREATE INDEX "ContestRegistration_userId_idx" ON "ContestRegistration"("userId");

-- CreateIndex
CREATE INDEX "ContestRegistration_status_idx" ON "ContestRegistration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContestRegistration_userId_contestId_key" ON "ContestRegistration"("userId", "contestId");

-- CreateIndex
CREATE INDEX "ContestAttempt_contestId_idx" ON "ContestAttempt"("contestId");

-- CreateIndex
CREATE INDEX "ContestAttempt_userId_idx" ON "ContestAttempt"("userId");

-- CreateIndex
CREATE INDEX "ContestAttempt_status_idx" ON "ContestAttempt"("status");

-- CreateIndex
CREATE INDEX "ContestAttempt_expiresAt_idx" ON "ContestAttempt"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContestAttempt_registrationId_key" ON "ContestAttempt"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestAttempt_userId_contestId_key" ON "ContestAttempt"("userId", "contestId");

-- CreateIndex
CREATE INDEX "ContestAnswer_attemptId_idx" ON "ContestAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "ContestAnswer_questionId_idx" ON "ContestAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestAnswer_attemptId_questionId_key" ON "ContestAnswer"("attemptId", "questionId");
