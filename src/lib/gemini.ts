import { GoogleGenerativeAI } from "@google/generative-ai";

const getModel = () => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY environment variable");
  }
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

export const model = {
  generateContent: (...args: Parameters<ReturnType<typeof getModel>["generateContent"]>) => 
    getModel().generateContent(...args),
};