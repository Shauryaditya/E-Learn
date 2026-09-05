import { auth } from "@clerk/nextjs";
import { ContestAttemptStatus, QuestionType } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

type AnswerInput = {
  questionId: string;
  selectedAnswer?: string;
};

const normalizeSelectedAnswer = (value?: string) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .sort()
    .join(",");

export async function POST(
  req: Request,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const answers = Array.isArray(body.answers) ? body.answers as AnswerInput[] : [];
    const autoSubmitted = body.autoSubmitted === true;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const attempt = await db.contestAttempt.findUnique({
      where: {
        userId_contestId: {
          userId,
          contestId: params.contestId,
        },
      },
      include: {
        contest: {
          include: {
            questions: {
              orderBy: { position: "asc" },
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: { position: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return new NextResponse("Attempt not found", { status: 404 });
    }

    if (attempt.status !== ContestAttemptStatus.IN_PROGRESS) {
      return new NextResponse("Attempt already submitted", { status: 400 });
    }

    const answerMap = new Map(
      answers.map((answer) => [answer.questionId, answer.selectedAnswer?.trim() || ""])
    );

    let score = 0;
    let totalMarks = 0;

    const answerOperations = attempt.contest.questions.map((contestQuestion) => {
      const question = contestQuestion.question;
      const marks = contestQuestion.marks ?? question.defaultMarks;
      const selectedAnswer = answerMap.get(question.id) || "";
      const normalizedSelectedAnswer = normalizeSelectedAnswer(selectedAnswer);
      const correctAnswer = normalizeSelectedAnswer(
        question.options
          .filter((option) => option.isCorrect)
          .map((option) => option.id)
          .join(",")
      );
      const isAutoGradable = question.questionType !== QuestionType.NUMERICAL && question.options.length > 0;
      const isCorrect = isAutoGradable && !!correctAnswer && normalizedSelectedAnswer === correctAnswer;
      const marksAwarded = isAutoGradable
        ? isCorrect
          ? marks
          : selectedAnswer
            ? -question.negativeMarks
            : 0
        : null;

      totalMarks += marks;

      if (marksAwarded !== null) {
        score += marksAwarded;
      }

      return db.contestAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: question.id,
          },
        },
        update: {
          selectedAnswer,
          isCorrect: isAutoGradable ? isCorrect : null,
          marksAwarded,
        },
        create: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedAnswer,
          isCorrect: isAutoGradable ? isCorrect : null,
          marksAwarded,
        },
      });
    });

    await db.$transaction([
      ...answerOperations,
      db.contestAttempt.update({
        where: { id: attempt.id },
        data: {
          status: autoSubmitted
            ? ContestAttemptStatus.AUTO_SUBMITTED
            : ContestAttemptStatus.SUBMITTED,
          score,
          totalMarks,
          percentage: totalMarks > 0 ? (score / totalMarks) * 100 : null,
          autoSubmitted,
          submittedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ score, totalMarks, autoSubmitted });
  } catch (error) {
    console.log("[CONTEST_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
