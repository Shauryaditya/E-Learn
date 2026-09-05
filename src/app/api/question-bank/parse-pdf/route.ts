import { auth } from "@clerk/nextjs";
import { QuestionType } from "@prisma/client";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import * as z from "zod";

import { model } from "@/lib/gemini";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;
const MIN_TEXT_CHARS_PER_PAGE = 120;
const TEXT_CHUNK_CHAR_LIMIT = 16000;
const VISION_CHUNK_PAGE_LIMIT = 3;
const pdfWorkerPath = path.join(
  process.cwd(),
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.js"
);

const optionSchema = z.object({
  optionText: z.string().trim().min(1),
  isCorrect: z.boolean().default(false),
});

const parsedQuestionSchema = z.object({
  questionText: z.string().trim().min(1),
  questionType: z.nativeEnum(QuestionType).default(QuestionType.SINGLE_CHOICE),
  defaultMarks: z.coerce.number().positive().default(1),
  negativeMarks: z.coerce.number().min(0).default(0),
  options: z.array(optionSchema).default([]),
  explanation: z.string().trim().optional().default(""),
});

const parsedQuestionsSchema = z.object({
  questions: z.array(parsedQuestionSchema).default([]),
});

type PageText = {
  pageNumber: number;
  text: string;
};

type PdfChunk = {
  startPage: number;
  endPage: number;
  text?: string;
  bytes?: Uint8Array;
};

const cleanJson = (value: string) =>
  value
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const extractJsonObject = (value: string) => {
  const cleaned = cleanJson(value);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
};

const repairJsonEscapes = (value: string) =>
  value.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");

const buildPrompt = (sourceDescription: string) => `
You are extracting exam questions from ${sourceDescription} for a contest question bank.

Extract multiple-choice, true/false, or numerical questions.
Preserve math and physics formulas as LaTeX text. Do not output SVG.
When writing LaTeX inside JSON string values, escape every backslash as \\\\.
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

If the answer key is not visible, set every option's isCorrect to false.
If a question cannot be confidently parsed, skip it.
For numerical questions, use an empty options array.
Return no markdown fences and no comments.
`;

const normalizeText = (value: string) =>
  value
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const extractTextByPage = async (buffer: Buffer): Promise<PageText[]> => {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerPath;
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      disableWorker: true,
      isEvalSupported: false,
      useWorkerFetch: false,
    } as any);
    const pdf = await loadingTask.promise;
    const pages: PageText[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");

      pages.push({
        pageNumber,
        text: normalizeText(text),
      });
    }

    await pdf.destroy();
    return pages;
  } catch (error) {
    console.error("[QUESTION_BANK_PDF_TEXT_EXTRACTION]", error);
    return [];
  }
};

const chunkTextPages = (pages: PageText[]) => {
  const chunks: PdfChunk[] = [];
  let currentText = "";
  let startPage = pages[0]?.pageNumber || 1;
  let endPage = startPage;

  for (const page of pages) {
    const pageText = `\n\nPage ${page.pageNumber}\n${page.text}`;

    if (currentText && currentText.length + pageText.length > TEXT_CHUNK_CHAR_LIMIT) {
      chunks.push({ startPage, endPage, text: currentText.trim() });
      currentText = pageText;
      startPage = page.pageNumber;
    } else {
      currentText += pageText;
    }

    endPage = page.pageNumber;
  }

  if (currentText.trim()) {
    chunks.push({ startPage, endPage, text: currentText.trim() });
  }

  return chunks;
};

const chunkPdfPages = async (sourcePdf: PDFDocument, pageLimit: number) => {
  const chunks: PdfChunk[] = [];
  const pageCount = sourcePdf.getPageCount();

  for (let startIndex = 0; startIndex < pageCount; startIndex += pageLimit) {
    const endIndex = Math.min(startIndex + pageLimit, pageCount);
    const chunkPdf = await PDFDocument.create();
    const pageIndexes = Array.from(
      { length: endIndex - startIndex },
      (_, index) => startIndex + index
    );
    const copiedPages = await chunkPdf.copyPages(sourcePdf, pageIndexes);
    copiedPages.forEach((page) => chunkPdf.addPage(page));

    chunks.push({
      startPage: startIndex + 1,
      endPage: endIndex,
      bytes: await chunkPdf.save(),
    });
  }

  return chunks;
};

const parseGeminiJson = (value: string) => {
  const jsonText = extractJsonObject(value);
  const parsed = JSON.parse(repairJsonEscapes(jsonText));
  const result = parsedQuestionsSchema.safeParse(parsed);

  if (!result.success) {
    console.error("[QUESTION_BANK_PARSE_PDF_SCHEMA]", result.error.flatten());
    return [];
  }

  return result.data.questions;
};

const parseTextChunk = async (chunk: PdfChunk) => {
  const result = await model.generateContent([
    buildPrompt(`PDF text from pages ${chunk.startPage}-${chunk.endPage}`),
    `PDF text:\n${chunk.text}`,
  ]);

  return parseGeminiJson(result.response.text());
};

const parseVisionChunk = async (chunk: PdfChunk) => {
  if (!chunk.bytes) {
    return [];
  }

  const result = await model.generateContent([
    buildPrompt(`PDF pages ${chunk.startPage}-${chunk.endPage}. Use OCR if the pages are scanned images.`),
    {
      inlineData: {
        data: Buffer.from(chunk.bytes).toString("base64"),
        mimeType: "application/pdf",
      },
    },
  ]);

  return parseGeminiJson(result.response.text());
};

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

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return new NextResponse("PDF is too large. Split it into smaller files under 30MB.", {
        status: 413,
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sourcePdf = await PDFDocument.load(buffer);
    const pageCount = sourcePdf.getPageCount();
    const extractedPages = await extractTextByPage(buffer);
    const textCharCount = extractedPages.reduce((total, page) => total + page.text.length, 0);
    const isLikelyScanned =
      extractedPages.length === 0 ||
      textCharCount / Math.max(pageCount, 1) < MIN_TEXT_CHARS_PER_PAGE;
    const parserMode = isLikelyScanned ? "vision_ocr" : "text";
    const chunks = isLikelyScanned
      ? await chunkPdfPages(sourcePdf, VISION_CHUNK_PAGE_LIMIT)
      : chunkTextPages(extractedPages);

    const questions = [];
    const failedChunks = [];

    for (const chunk of chunks) {
      try {
        const parsedQuestions = isLikelyScanned
          ? await parseVisionChunk(chunk)
          : await parseTextChunk(chunk);
        questions.push(...parsedQuestions);
      } catch (error) {
        console.error("[QUESTION_BANK_PARSE_PDF_CHUNK]", {
          startPage: chunk.startPage,
          endPage: chunk.endPage,
          error,
        });
        failedChunks.push({
          startPage: chunk.startPage,
          endPage: chunk.endPage,
        });
      }
    }

    return NextResponse.json({
      questions,
      meta: {
        pageCount,
        parserMode,
        textCharCount,
        chunkCount: chunks.length,
        failedChunks,
      },
    });
  } catch (error) {
    console.error("[QUESTION_BANK_PARSE_PDF]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
