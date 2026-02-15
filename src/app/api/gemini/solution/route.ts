
import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();

    if (!fileUrl) {
        return new NextResponse("File URL is required", { status: 400 });
    }

    // Fetch the PDF file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
    You are an expert tutor. I have a document (likely containing questions or problems). 
    Please identify the questions in the provided PDF and provide a detailed step-by-step solution for each.
    
    If it's a multiple choice question paper, provide the answer key and a short explanation for each.
    Format your response in clean Markdown.
    `;

    // Send the prompt and the PDF data directly to Gemini
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
    console.log("Solution:",text);
    return NextResponse.json({ solution: text });

  } catch (error) {
    console.error("[GEMINI_SOLUTION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
