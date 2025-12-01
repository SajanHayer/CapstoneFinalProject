import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/authRoutes";
import { vehicleRouter } from "./routes/vehicleRoutes";
import { assistantRouter } from "./routes/assistantRoutes";
import { healthRouter } from "./routes/healthRoutes";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/assistant", assistantRouter);

// Sample API endpoint
app.get("/api/data", (req, res) => {
  res.json({
    message: "Welcome to the Let\'s Ride Canada API",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
