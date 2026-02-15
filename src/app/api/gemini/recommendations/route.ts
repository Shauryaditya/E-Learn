
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { model } from "@/lib/gemini";

export const maxDuration = 60; // Allow 60 seconds for generation

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { subjects, grade, board, targetExam } = await req.json();

    const prompt = `
      You are an expert educational consultant.
      Student Profile:
      - Grade: ${grade}
      - Board: ${board}
      - Subjects: ${subjects.join(", ")}
      - Target Exam: ${targetExam || "General Excellence"}

      Generate 5 highly relevant external web resources (YouTube channels, official websites, or high-quality articles) specifically for a student in this grade and board.
      Also generate 3 specific, actionable study tips or a mini 1-week routine.
      
      IMPORTANT: To ensure URLs are valid, follow these rules:
      1. If it is a main homepage (e.g. Khan Academy, NCERT, Coursera), use the direct official URL (e.g. https://www.khanacademy.org).
      2. For specific videos, articles, or topics where links might change, construct a Google Search URL instead.
         Example: "https://www.google.com/search?q=Class+10+Math+Quadratic+Equations+Notes"
      3. DO NOT hallucinate direct links to specific PDFs or pages that might not exist. When in doubt, use a Google Search URL.

      Return ONLY a strictly valid JSON object with this structure:
      {
        "resources": [
            { "title": "Resource Name", "type": "Video/Website/Article", "url": "https://www.google.com/search?q=...", "description": "Brief reason why it's good." }
        ],
        "tips": [
            "Tip 1...",
            "Tip 2..."
        ]
      }
      Do not include \`\`\`json markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const json = JSON.parse(cleanedText);
        return NextResponse.json(json);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", text);
        return new NextResponse("Failed to generate valid JSON", { status: 500 });
    }

  } catch (error) {
    console.error("[GEMINI_RECOMMENDATIONS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
