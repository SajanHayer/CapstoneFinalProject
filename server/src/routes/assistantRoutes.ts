// server/src/routes/assistantRoutes.ts
import { Router } from "express";
import { model } from "../services/googleapi";

export const assistantRouter = Router();

// POST /api/assistant/chat
assistantRouter.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages[] is required" });
    }

    // Expect messages in shape: { role: "user" | "assistant", content: string }
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    }));

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
      systemInstruction: {
        role: "system",
        parts: [
          {
            text:
              "You are the PowerBidz Assistant. " +
              "Help users with questions about browsing vehicles, auctions, " +
              "their account, and general car-buying questions. " +
              "Be concise, friendly, and avoid making up technical specs.",
          },
        ],
      },
    });

    const text = result.response.text();
    return res.json({ reply: text });
  } catch (err) {
    console.error("Assistant (Gemini) error:", err);
    return res.status(500).json({ message: "Assistant error" });
  }
});
