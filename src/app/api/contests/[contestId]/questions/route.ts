import { auth } from "@clerk/nextjs";
import { QuestionType } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

type OptionInput = {
  optionText: string;
  isCorrect: boolean;
};

type QuestionInput = {
  questionText: string;
  questionType?: QuestionType;
  defaultMarks?: number;
  negativeMarks?: number;
  explanation?: string;
  imageUrl?: string;
  options?: OptionInput[];
};

const normalizeQuestion = (question: QuestionInput, userId: string) => {
  const optionQuestionTypes: QuestionType[] = [
    QuestionType.SINGLE_CHOICE,
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.TRUE_FALSE,
  ];
  const parsedType = Object.values(QuestionType).includes(question.questionType as QuestionType)
    ? question.questionType as QuestionType
    : QuestionType.SINGLE_CHOICE;
  const defaultMarks = Number(question.defaultMarks);
  const negativeMarks = Number(question.negativeMarks || 0);

  const normalizedOptions = (question.options || [])
    .map((option, index) => ({
      optionText: option.optionText?.trim(),
      isCorrect: !!option.isCorrect,
      position: index + 1,
    }))
    .filter((option) => option.optionText);
  const questionType =
    optionQuestionTypes.includes(parsedType) && normalizedOptions.length < 2
      ? QuestionType.NUMERICAL
      : parsedType;

  if (!question.questionText?.trim()) {
    throw new Error("Question text is required");
  }

  if (!Number.isFinite(defaultMarks) || defaultMarks <= 0) {
    throw new Error("Question text and marks are required");
  }

  if (
    optionQuestionTypes.includes(questionType) &&
    normalizedOptions.length < 2
  ) {
    throw new Error("At least two options are required");
  }

  return {
    userId,
    questionText: question.questionText.trim(),
    questionType,
    defaultMarks,
    negativeMarks: Number.isFinite(negativeMarks) && negativeMarks > 0 ? negativeMarks : 0,
    explanation: question.explanation || null,
    imageUrl: question.imageUrl || null,
    options: {
      create: questionType === QuestionType.NUMERICAL ? [] : normalizedOptions,
    },
  };
};

export async function POST(
  req: Request,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { questionId, marks } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.findUnique({
      where: { id: params.contestId },
      include: { questions: true },
    });

    if (!contest || contest.userId !== userId) {
      return new NextResponse("Contest not found", { status: 404 });
    }

    if (Array.isArray(body.questions)) {
      const parsedQuestions = body.questions as QuestionInput[];

      if (parsedQuestions.length === 0) {
        return new NextResponse("Questions are required", { status: 400 });
      }

      const startPosition = contest.questions.length + 1;
      const skippedQuestions: { index: number; reason: string }[] = [];
      const normalizedQuestions = parsedQuestions.flatMap((question, index) => {
        try {
          return [{ question, data: normalizeQuestion(question, userId), originalIndex: index }];
        } catch (error: any) {
          skippedQuestions.push({
            index,
            reason: error?.message || "Could not normalize question",
          });
          return [];
        }
      });

      if (normalizedQuestions.length === 0) {
        return NextResponse.json(
          {
            count: 0,
            skippedCount: skippedQuestions.length,
            skippedQuestions,
            message: "No valid questions found in this parsed PDF",
          },
          { status: 400 }
        );
      }

      const operations = normalizedQuestions.flatMap(({ question, data }, index) => {
        const questionId = randomUUID();

        return [
          db.questionBank.create({
            data: {
              id: questionId,
              ...data,
            },
          }),
          db.contestQuestion.create({
            data: {
              contestId: params.contestId,
              questionId,
              marks: question.defaultMarks ? Number(question.defaultMarks) : data.defaultMarks,
              position: startPosition + index,
            },
          }),
        ];
      });

      await db.$transaction(operations);

      return NextResponse.json({
        count: normalizedQuestions.length,
        skippedCount: skippedQuestions.length,
        skippedQuestions,
      });
    }

    if (!questionId) {
      return new NextResponse("Question is required", { status: 400 });
    }

    const question = await db.questionBank.findUnique({
      where: { id: questionId },
      select: { id: true, userId: true },
    });

    if (!question || question.userId !== userId) {
      return new NextResponse("Question not found", { status: 404 });
    }

    const contestQuestion = await db.contestQuestion.create({
      data: {
        contestId: params.contestId,
        questionId,
        marks: marks ? Number(marks) : null,
        position: contest.questions.length + 1,
      },
    });

    return NextResponse.json(contestQuestion);
  } catch (error: any) {
    if (error?.message) {
      return new NextResponse(error.message, { status: 400 });
    }

    console.log("[CONTEST_QUESTIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
