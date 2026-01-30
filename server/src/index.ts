import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/authRoutes";
import { vehicleRouter } from "./routes/vehicleRoutes";
import { assistantRouter } from "./routes/assistantRoutes";
import { healthRouter } from "./routes/healthRoutes";
import { auctionRouter } from "./routes/auctionRoutes.ts";
import { startAuctionCron } from "./cron/auctionEnd.cron";

import { Server } from "socket.io";
import http from "http";
import { registerAuctionSockets } from "./sockets/auction.socket.ts";
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/listings", auctionRouter);

startAuctionCron();

// Sample API endpoint
app.get("/api/data", (req, res) => {
  res.json({
    message: "Welcome to the Let\'s Ride Canada API",
    timestamp: new Date().toISOString(),
  });
});

const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// io.on("connection", (socket) => {
//   console.log("🔌 Socket connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("❌ Socket disconnected:", socket.id);
//   });
// });

registerAuctionSockets();
// Start server
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });

httpServer.listen(PORT, () => {
  console.log(`✅ Server and Socket running on http://localhost:${PORT}`);
});
