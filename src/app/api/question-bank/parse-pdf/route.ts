import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { model } from "@/lib/gemini";

export const maxDuration = 60;

const cleanJson = (value: string) =>
  value
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return new NextResponse("PDF file is required", { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return new NextResponse("Only PDF files are supported", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      You are extracting exam questions from a PDF for a contest question bank.

      Extract multiple-choice or numerical questions from the PDF.
      Preserve math and physics formulas as LaTeX text. Do not output SVG.
      For MCQ options, convert complex formulas to LaTeX such as:
      \\sqrt{8m(\\frac{hc}{\\lambda}-\\phi)}/eB

      Return strictly valid JSON only:
      {
        "questions": [
          {
            "questionText": "Question text with LaTeX when needed",
            "questionType": "SINGLE_CHOICE",
            "defaultMarks": 1,
            "negativeMarks": 0,
            "options": [
              { "optionText": "Option text or LaTeX", "isCorrect": false },
              { "optionText": "Option text or LaTeX", "isCorrect": true }
            ],
            "explanation": "Short explanation if available, using LaTeX when needed"
          }
        ]
      }

      Allowed questionType values:
      SINGLE_CHOICE, MULTIPLE_CHOICE, NUMERICAL, TRUE_FALSE.

      If the answer key is not visible in the PDF, set every option's isCorrect to false.
      If a question cannot be confidently parsed, skip it.
      Return no markdown fences and no comments.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
    ]);

    const text = result.response.text();

    try {
      const parsed = JSON.parse(cleanJson(text));
      return NextResponse.json({
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      });
    } catch {
      console.error("[QUESTION_BANK_PARSE_PDF_JSON]", text);
      return new NextResponse("Failed to parse PDF into valid JSON", { status: 500 });
    }
  } catch (error) {
    console.error("[QUESTION_BANK_PARSE_PDF]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
