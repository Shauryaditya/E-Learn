import { auth } from "@clerk/nextjs";
import { QuestionType } from "@prisma/client";
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

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (Array.isArray(body.questions)) {
      const questions = await db.$transaction(
        (body.questions as QuestionInput[]).map((question) =>
          db.questionBank.create({
            data: normalizeQuestion(question, userId),
            include: {
              options: {
                orderBy: { position: "asc" },
              },
            },
          })
        )
      );

      return NextResponse.json({ questions });
    }

    const question = await db.questionBank.create({
      data: normalizeQuestion(body, userId),
      include: {
        options: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(question);
  } catch (error: any) {
    if (error?.message) {
      return new NextResponse(error.message, { status: 400 });
    }

    console.log("[QUESTION_BANK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
