import { Router } from "express";
import { query } from "../db/db";
import { hashPassword, comparePassword, signToken } from "../utils/auth";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({
        message: "email, password, role, and name are required",
      });
    }

    // check for existing user
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const password_hash = await hashPassword(password);

    // Insert using correct schema fields
    const result = await query(
      `
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [email, password_hash, name, role],
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role });

    // Never send password hash to client
    delete user.password_hash;

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

    // don’t send hash to client
    delete (user as any).password_hash;

        // Use signToken() to generate JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Store token in HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 3600000, // 1 hour
    });

    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
