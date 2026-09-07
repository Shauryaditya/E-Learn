import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

export const attemptInputSchema = z.object({
  version: z.string().datetime(),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    selectedAnswer: z.string().max(10000),
  })).max(1000),
  autoSubmitted: z.boolean().optional(),
});

export class AttemptError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

type Input = z.infer<typeof attemptInputSchema>;
type Question = {
  id: string;
  questionType: string;
  defaultMarks: number;
  negativeMarks: number;
  options: { id: string; isCorrect: boolean }[];
};

export function validateAnswers(input: Input["answers"], questions: Question[]) {
  const available = new Map(questions.map(question => [question.id, question]));
  const answers = new Map<string, string>();
  for (const answer of input) {
    const question = available.get(answer.questionId);
    if (!question || answers.has(answer.questionId)) {
      throw new AttemptError(400, "INVALID_ANSWER", "Invalid or repeated question.");
    }
    const value = question.questionType === "NUMERICAL" ? answer.selectedAnswer : answer.selectedAnswer.trim();
    if (question.questionType !== "NUMERICAL" && value) {
      const selected = value.split(",");
      if (
        new Set(selected).size !== selected.length ||
        (question.questionType !== "MULTIPLE_CHOICE" && selected.length !== 1) ||
        selected.some(id => !question.options.some(option => option.id === id))
      ) {
        throw new AttemptError(400, "INVALID_ANSWER", "Invalid answer option.");
      }
    }
    answers.set(answer.questionId, value);
  }
  return answers;
}

export function gradeAnswer(question: Question, marks: number, selectedAnswer: string) {
  const correct = question.options.filter(option => option.isCorrect).map(option => option.id).sort();
  // Missing keys and free-text answers stay ungraded, without a penalty.
  if (question.questionType === "NUMERICAL" || !correct.length) {
    return { isCorrect: null, marksAwarded: null };
  }
  const isCorrect = correct.join(",") === selectedAnswer.split(",").sort().join(",");
  return {
    isCorrect,
    marksAwarded: isCorrect ? marks : selectedAnswer ? -question.negativeMarks : 0,
  };
}

export async function writeContestAttempt(
  database: Pick<PrismaClient, "$transaction">,
  userId: string,
  contestId: string,
  input: Input,
  mode: "save" | "submit",
  clock = () => new Date(),
) {
  return database.$transaction(async tx => {
    // Serialize this student's saves and submissions using the same attempt row.
    await tx.$queryRaw(Prisma.sql`
      SELECT "id" FROM "ContestAttempt"
      WHERE "userId" = ${userId} AND "contestId" = ${contestId}
      FOR UPDATE
    `);
    const attempt = await tx.contestAttempt.findUnique({
      where: { userId_contestId: { userId, contestId } },
      include: {
        answers: true,
        registration: { select: { status: true } },
        contest: { include: { questions: { include: { question: { include: { options: true } } } } } },
      },
    });
    if (!attempt) throw new AttemptError(404, "NOT_FOUND", "Attempt not found.");
    if (attempt.registration?.status !== "REGISTERED") {
      throw new AttemptError(403, "NOT_REGISTERED", "Your registration is no longer active.");
    }
    const now = clock();
    if (attempt.status !== "IN_PROGRESS") {
      return { status: attempt.status, version: attempt.updatedAt.toISOString(), serverTime: now.toISOString() };
    }
    const expired = now >= attempt.expiresAt;
    if (expired && mode === "save") {
      throw new AttemptError(409, "DEADLINE_PASSED", "Time is up. Only answers saved before the deadline will count.");
    }
    if (!expired && attempt.updatedAt.toISOString() !== input.version) {
      throw new AttemptError(409, "ATTEMPT_CONFLICT", "This attempt changed in another session. Reload to recover the latest saved answers.");
    }
    const questions = attempt.contest.questions;
    const incoming = expired ? new Map<string, string>() : validateAnswers(input.answers, questions.map(item => item.question));
    const saved = new Map(attempt.answers.map(answer => [answer.questionId, answer.selectedAnswer || ""]));
    const rows = questions.map(item => {
      const selectedAnswer = incoming.get(item.questionId) ?? saved.get(item.questionId) ?? "";
      return {
        attemptId: attempt.id,
        questionId: item.questionId,
        selectedAnswer,
        ...(mode === "submit"
          ? gradeAnswer(item.question, item.marks ?? item.question.defaultMarks, selectedAnswer)
          : { isCorrect: null, marksAwarded: null }),
      };
    });
    const changedRows = mode === "save" ? rows.filter(row => incoming.has(row.questionId)) : rows;
    await tx.contestAnswer.deleteMany({ where: {
      attemptId: attempt.id,
      ...(mode === "save" ? { questionId: { in: changedRows.map(row => row.questionId) } } : {}),
    } });
    if (changedRows.length) await tx.contestAnswer.createMany({ data: changedRows });

    const score = rows.reduce((sum, answer) => sum + (answer.marksAwarded ?? 0), 0);
    const totalMarks = questions.reduce((sum, item) => sum + (item.marks ?? item.question.defaultMarks), 0);
    const autoSubmitted = expired || input.autoSubmitted === true;
    const updated = await tx.contestAttempt.update({
      where: { id: attempt.id },
      data: {
        // Keep optimistic versions distinct for writes in the same millisecond.
        updatedAt: new Date(Math.max(now.getTime(), attempt.updatedAt.getTime() + 1)),
        ...(mode === "submit" ? {
          status: autoSubmitted ? "AUTO_SUBMITTED" : "SUBMITTED",
          submittedAt: now,
          autoSubmitted,
          score,
          totalMarks,
          percentage: totalMarks > 0 ? score / totalMarks * 100 : null,
        } : {}),
      },
    });
    return {
      status: updated.status,
      version: updated.updatedAt.toISOString(),
      serverTime: now.toISOString(),
      ignoredLateAnswers: expired,
    };
  }, { maxWait: 5000, timeout: 10000 });
}
