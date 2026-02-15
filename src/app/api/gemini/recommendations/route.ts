
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { model } from "@/lib/gemini";

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
      
      Return ONLY a strictly valid JSON object with this structure:
      {
        "resources": [
            { "title": "Resource Name", "type": "Video/Website/Article", "url": "https://example.com", "description": "Brief reason why it's good." }
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
