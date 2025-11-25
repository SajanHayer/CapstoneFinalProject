import { Router } from "express";
import { query } from "../db";
import { hashPassword, comparePassword, signToken } from "../utils/auth";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, city, province } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password, role are required" });
    }

    // check if email already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const password_hash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, city, province)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email, password_hash, name || null, role, city || null, province || null,]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, role: user.role });

    // don’t send hash to client
    delete (user as any).password_hash;

    res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
