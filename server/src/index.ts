import express from "express";
import cors from "cors";
import { db, query } from "./db/db";
import { authRouter } from "./routes/authRoutes";
import vehicleRouter from "./routes/vehicleRoutes";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running!" });
});

// Database health check
app.get("/api/db-health", async (req, res) => {
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

app.use("/api/auth", authRouter);
app.use("/api/vehicles", vehicleRouter);

// Sample API endpoint
app.get("/api/data", (req, res) => {
  res.json({
    message: "Welcome to the PowerBiDz API",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
