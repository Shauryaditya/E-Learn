import { auth } from "@clerk/nextjs";
import { ContestAttemptStatus, QuestionType } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { gradeAnswer } from "@/lib/contest-attempts";

const submittedStatuses = [
  ContestAttemptStatus.SUBMITTED,
  ContestAttemptStatus.AUTO_SUBMITTED,
  ContestAttemptStatus.EVALUATED,
];

export async function PATCH(
  req: Request,
  { params }: { params: { contestId: string; contestQuestionId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const correctOptionIds = Array.isArray(body.correctOptionIds)
      ? body.correctOptionIds.filter((id: unknown): id is string => typeof id === "string")
      : [];

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contestQuestion = await db.contestQuestion.findUnique({
      where: {
        id: params.contestQuestionId,
        contestId: params.contestId,
      },
      include: {
        contest: {
          select: { id: true, userId: true },
        },
        question: {
          include: {
            options: {
              orderBy: { position: "asc" },
            },
          },
        },
      },
    });

    if (!contestQuestion || contestQuestion.contest.userId !== userId) {
      return new NextResponse("Contest question not found", { status: 404 });
    }

    const question = contestQuestion.question;

    if (question.questionType === QuestionType.NUMERICAL || question.options.length === 0) {
      return new NextResponse("This question requires manual review", { status: 400 });
    }

    const optionIds = new Set(question.options.map((option) => option.id));
    const uniqueCorrectOptionIds = Array.from(new Set<string>(correctOptionIds));
    const hasInvalidOption = uniqueCorrectOptionIds.some((id) => !optionIds.has(id));

    if (hasInvalidOption) {
      return new NextResponse("Invalid correct option selected", { status: 400 });
    }

    if (uniqueCorrectOptionIds.length === 0) {
      return new NextResponse("Select at least one correct option", { status: 400 });
    }

    if (
      question.questionType !== QuestionType.MULTIPLE_CHOICE &&
      uniqueCorrectOptionIds.length > 1
    ) {
      return new NextResponse("Only one correct option is allowed", { status: 400 });
    }

    const updatedOptions = await db.$transaction(
      question.options.map((option) =>
        db.questionBankOption.update({
          where: { id: option.id },
          data: { isCorrect: uniqueCorrectOptionIds.includes(option.id) },
        })
      )
    );

    const contest = await db.contest.findUnique({
      where: { id: params.contestId },
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
        attempts: {
          where: {
            status: {
              in: submittedStatuses,
            },
          },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!contest) {
      return new NextResponse("Contest not found", { status: 404 });
    }

    const regradeOperations = contest.attempts.flatMap((attempt) => {
      const answersByQuestionId = new Map(
        attempt.answers.map((answer) => [answer.questionId, answer])
      );
      let score = 0;
      let totalMarks = 0;
      let fullyGraded = true;

      const answerUpdates = contest.questions.flatMap((item) => {
        const currentQuestion = item.question;
        const answer = answersByQuestionId.get(currentQuestion.id);
        const selectedAnswer = answer?.selectedAnswer || "";
        const marks = item.marks ?? currentQuestion.defaultMarks;
        const { isCorrect, marksAwarded } = gradeAnswer(currentQuestion, marks, selectedAnswer);

        totalMarks += marks;

        if (marksAwarded !== null) {
          score += marksAwarded;
        } else {
          fullyGraded = false;
        }

        if (!answer) {
          fullyGraded = false;
          return [];
        }

        return db.contestAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            marksAwarded,
          },
        });
      });

      return [
        ...answerUpdates,
        db.contestAttempt.update({
          where: { id: attempt.id },
          data: {
            status: fullyGraded ? ContestAttemptStatus.EVALUATED : attempt.status,
            score,
            totalMarks,
            percentage: totalMarks > 0 ? (score / totalMarks) * 100 : null,
          },
        }),
      ];
    });

    if (regradeOperations.length > 0) {
      await db.$transaction(regradeOperations);
    }

    return NextResponse.json({
      options: updatedOptions,
      regradedAttempts: contest.attempts.length,
    });
  } catch (error: any) {
    if (error?.message) {
      return new NextResponse(error.message, { status: 400 });
    }

    console.log("[CONTEST_QUESTION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { contestId: string; contestQuestionId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.findUnique({
      where: { id: params.contestId },
      select: { userId: true },
    });

    if (!contest || contest.userId !== userId) {
      return new NextResponse("Contest not found", { status: 404 });
    }

    const deleted = await db.contestQuestion.delete({
      where: {
        id: params.contestQuestionId,
        contestId: params.contestId,
      },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    console.log("[CONTEST_QUESTION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
