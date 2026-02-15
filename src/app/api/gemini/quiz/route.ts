
import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { chapterId, courseId, difficulty = "Easy" } = await req.json();

    if (!chapterId || !courseId) {
        return new NextResponse("Chapter ID and Course ID are required", { status: 400 });
    }

    // 1. Fetch Chapter Content
    const chapter = await db.chapter.findUnique({
        where: {
            id: chapterId,
            courseId: courseId
        },
        include: {
            attachments: true,
            muxData: true
        }
    });

    if (!chapter) {
        return new NextResponse("Chapter not found", { status: 404 });
    }

    const parts: any[] = [];
    
    // Add text context
    const contextText = `Chapter Title: ${chapter.title}\nDescription: ${chapter.description}\n`;
    parts.push(contextText);

    // 2. Fetch and add PDF Attachments (limit to 2 for performance)
    let pdfCount = 0;
    for (const attachment of chapter.attachments) {
        if (attachment.url.endsWith(".pdf") && pdfCount < 2) {
            try {
                const response = await fetch(attachment.url);
                const arrayBuffer = await response.arrayBuffer();
                const base64Data = Buffer.from(arrayBuffer).toString("base64");
                
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: "application/pdf",
                    },
                });
                pdfCount++;
            } catch (e) {
                console.error(`Failed to fetch pdf ${attachment.name}. URL: ${attachment.url}`);
            }
        }
    }

    if (parts.length === 1 && contextText.length < 50) {
         return new NextResponse("Not enough content in this chapter to generate a quiz. Please add a detailed description or attach PDF documents.", { status: 400 });
    }

    const prompt = `
      You are a helpful AI assistant that generates multiple-choice questions (MCQs) for students.
      Based on the provided course chapter content (text and PDFs), generate 5 ${difficulty} level MCQs.
      
      Return the response in strictly valid JSON format with the following structure:
      {
        "questions": [
          {
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A", 
            "explanation": "Brief explanation of why the answer is correct."
          }
        ]
      }
      Do not include any markdown formatting like \`\`\`json. Just the raw JSON object.
      `;
      
      parts.push(prompt);

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();
    
    // Clean up if Gemini adds markdown code blocks despite instructions
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const json = JSON.parse(cleanedText);
        return NextResponse.json(json);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", text);
        return new NextResponse("Failed to generate valid JSON", { status: 500 });
    }

  } catch (error) {
    console.error("[GEMINI_QUIZ]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
