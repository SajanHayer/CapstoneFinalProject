import { Router } from "express";
import { query, db } from "../db/db";
import { hashPassword, comparePassword, signToken } from "../utils/auth";
import { requireAuth } from "../middleware/requireAuth";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const authRouter = Router();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(STRIPE_KEY);


authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({
        message: "email, password, role, and name are required",
      });
    }

    // check for existing user
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existing.length > 0) {
      return res.status(409).json({ message: "User already Exists" });
    }
    const password_hash = await hashPassword(password);
    // console.log(stripe.customers)

    const {customer, error} = await stripe.customers.create({
      name: name,
      email: email,
    });
    if (error){
      return res.json({message: 'Stripe Failed To Create Customer'})
    }

    
    const [user] = await db
      .insert(users)
      .values({ email, password_hash, name, role })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        customer_id: customer.id,
      });
    

    res.status(201).json({ user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      console.log("user");
      return res.status(401).json({ message: "User does not exist" });
    }

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid Password" });
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

// /api/auth/logout
authRouter.post("/logout", async (_req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  res.json({ message: "Logged out" });
});

// GET /api/users/:id -> Get user info by ID
authRouter.get("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

authRouter.get("/check", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({ user: user });
});
