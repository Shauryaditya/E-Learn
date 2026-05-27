DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContestRegistrationStatus') THEN
        CREATE TYPE "ContestRegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED', 'DISQUALIFIED');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContestAttemptStatus') THEN
        CREATE TYPE "ContestAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Contest" (
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
    "price" DOUBLE PRECISION,
    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Contest" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "QuestionBank" (
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

CREATE TABLE IF NOT EXISTS "QuestionBankOption" (
    "id" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuestionBankOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContestQuestion" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "marks" DOUBLE PRECISION,
    "contestId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContestQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContestRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ContestRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "contestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContestRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContestAttempt" (
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

CREATE TABLE IF NOT EXISTS "ContestAnswer" (
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

CREATE INDEX IF NOT EXISTS "Contest_userId_idx" ON "Contest"("userId");
CREATE INDEX IF NOT EXISTS "Contest_categoryId_idx" ON "Contest"("categoryId");
CREATE INDEX IF NOT EXISTS "Contest_startsAt_idx" ON "Contest"("startsAt");
CREATE INDEX IF NOT EXISTS "Contest_isPublished_idx" ON "Contest"("isPublished");
CREATE INDEX IF NOT EXISTS "QuestionBank_userId_idx" ON "QuestionBank"("userId");
CREATE INDEX IF NOT EXISTS "QuestionBank_questionType_idx" ON "QuestionBank"("questionType");
CREATE INDEX IF NOT EXISTS "QuestionBankOption_questionId_idx" ON "QuestionBankOption"("questionId");
CREATE INDEX IF NOT EXISTS "ContestQuestion_questionId_idx" ON "ContestQuestion"("questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "ContestQuestion_contestId_questionId_key" ON "ContestQuestion"("contestId", "questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "ContestQuestion_contestId_position_key" ON "ContestQuestion"("contestId", "position");
CREATE INDEX IF NOT EXISTS "ContestRegistration_contestId_idx" ON "ContestRegistration"("contestId");
CREATE INDEX IF NOT EXISTS "ContestRegistration_userId_idx" ON "ContestRegistration"("userId");
CREATE INDEX IF NOT EXISTS "ContestRegistration_status_idx" ON "ContestRegistration"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "ContestRegistration_userId_contestId_key" ON "ContestRegistration"("userId", "contestId");
CREATE INDEX IF NOT EXISTS "ContestAttempt_contestId_idx" ON "ContestAttempt"("contestId");
CREATE INDEX IF NOT EXISTS "ContestAttempt_userId_idx" ON "ContestAttempt"("userId");
CREATE INDEX IF NOT EXISTS "ContestAttempt_status_idx" ON "ContestAttempt"("status");
CREATE INDEX IF NOT EXISTS "ContestAttempt_expiresAt_idx" ON "ContestAttempt"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ContestAttempt_registrationId_key" ON "ContestAttempt"("registrationId");
CREATE UNIQUE INDEX IF NOT EXISTS "ContestAttempt_userId_contestId_key" ON "ContestAttempt"("userId", "contestId");
CREATE INDEX IF NOT EXISTS "ContestAnswer_attemptId_idx" ON "ContestAnswer"("attemptId");
CREATE INDEX IF NOT EXISTS "ContestAnswer_questionId_idx" ON "ContestAnswer"("questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "ContestAnswer_attemptId_questionId_key" ON "ContestAnswer"("attemptId", "questionId");
