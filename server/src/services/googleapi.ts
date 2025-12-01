import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use a current, supported Gemini model
export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});
