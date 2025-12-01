import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { healthRouter } from "../src/routes/healthRoutes";

const app = express();
app.use("/api/health", healthRouter);

describe("Health Routes", () => {
  it("GET /api/health should return server health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.uptime).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it("GET /api/health/db should return database health", async () => {
    const res = await request(app).get("/api/health/db");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.time).toBeDefined();
  });

  
});
