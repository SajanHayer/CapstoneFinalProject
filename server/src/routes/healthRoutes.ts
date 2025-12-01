import { Router } from "express";
import { query } from "../db/db";
import { supabase } from "../services/supabase";
import { model } from "../services/googleapi";

export const healthRouter = Router();

// Health check endpoint
// To check health run curl -i http://localhost:8080/api/{api_endpoint}

// Server Check
healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Database Check
healthRouter.get("/db", async (req, res) => {
  try {
    const result = await query("SELECT NOW()");
    res.json({
      status: "ok",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("DB health check error:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

healthRouter.get("/supabase", async (_req, res) => {
  try {
    // List files to check connection
    const { data, error } = await supabase.storage.from("images").list();
    if (error) throw error;

    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

healthRouter.get("/assitant", async (_req, res) => {
  try {
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: "Ping" }],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 10, // very small response
      },
      systemInstruction: {
        role: "system",
        parts: [
          {
            text: "You are a test assistant. Reply briefly.",
          },
        ],
      },
    });

    res.json({
      status: "ok",
      message: "Gemini API reachable",
    });
  } catch (error) {
    console.error("Gemini health check error:", error);
    res.status(500).json({
      status: "error",
      message: "Gemini API unreachable or returned an error",
    });
  }
});
