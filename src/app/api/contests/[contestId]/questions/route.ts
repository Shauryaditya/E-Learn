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

  const normalizedOptions = (question.options || [])
    .map((option, index) => ({
      optionText: option.optionText?.trim(),
      isCorrect: !!option.isCorrect,
      position: index + 1,
    }))
    .filter((option) => option.optionText);

  if (!question.questionText || !question.defaultMarks) {
    throw new Error("Question text and marks are required");
  }

  if (
    optionQuestionTypes.includes(parsedType) &&
    normalizedOptions.length < 2
  ) {
    throw new Error("At least two options are required");
  }

  return {
    userId,
    questionText: question.questionText,
    questionType: parsedType,
    defaultMarks: Number(question.defaultMarks),
    negativeMarks: Number(question.negativeMarks || 0),
    explanation: question.explanation || null,
    imageUrl: question.imageUrl || null,
    options: {
      create: normalizedOptions,
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
      const operations = parsedQuestions.flatMap((question, index) => {
        const questionId = randomUUID();

        return [
          db.questionBank.create({
            data: {
              id: questionId,
              ...normalizeQuestion(question, userId),
            },
          }),
          db.contestQuestion.create({
            data: {
              contestId: params.contestId,
              questionId,
              marks: question.defaultMarks ? Number(question.defaultMarks) : null,
              position: startPosition + index,
            },
          }),
        ];
      });

      await db.$transaction(operations);

      return NextResponse.json({ count: parsedQuestions.length });
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
