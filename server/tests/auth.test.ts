import { describe, it, expect, vi, beforeEach} from "vitest";
import express from "express";
import request from "supertest";
import {hashPassword, comparePassword} from "../src/utils/auth";
import { authRouter } from "../src/routes/authRoutes";
import * as dbModule from "../src/db/db";

const app = express();

describe("Auth Utilities", () => {
  it("should hash and compare password correctly", async () => {
    const plainPassword = "mySecurePassword";
    const hashedPassword = await hashPassword(plainPassword);
    const comparePasswordResult = await comparePassword(plainPassword, hashedPassword);

    expect(comparePasswordResult).toBe(true);
  });
});

//changes messages to use json, and use the correct router 
app.use(express.json());
app.use("/api/auth", authRouter);

// Mock the query function to change it to what we want 
vi.mock("../src/db/db", () => {
  return {
    query: vi.fn(),
  };
});

describe("Auth Routes", () => {
// Clear mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------- LOGIN ----------------
  it("POST /api/auth/login should return 401 for invalid credentials (no user)", async () => {
    // change the query mock to return no users only test the credentials 
    // and logic in the code
    (dbModule.query as any).mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "testuser@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});