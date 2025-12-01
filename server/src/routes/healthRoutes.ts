import { Router } from "express";
import {db, query} from "../db/db";

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
