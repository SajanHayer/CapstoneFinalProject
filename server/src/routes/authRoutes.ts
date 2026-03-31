import { Router } from "express";
import { db } from "../db/db";
import { hashPassword, comparePassword, signToken } from "../utils/auth";
import { requireAuth } from "../middleware/requireAuth";
import { users, listings, bids, transactions, vehicles, listingInteractions } from "../db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { stripe } from "../services/stripe";
import { sendVerificationEmail } from "../utils/email";

export const authRouter = Router();

// Password policy
const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const generateVerificationCode = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

async function getAuthUser(req: any, res: any) {
  await new Promise<void>((resolve) => {
    requireAuth(req, res, () => resolve());
  });

  return req.user;
}

// ================= REGISTER =================
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({
        message: "email, password, role, and name are required",
      });
    }

    if (!passwordPolicy.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existing.length > 0) {
      return res.status(409).json({ message: "User already Exists" });
    }

    const password_hash = await hashPassword(password);
    // console.log(stripe.customers)
    // console.log(stripe)
    const customer = await stripe.customers.create({
      name: name,
      email: email,
    });
    const verificationCode = generateVerificationCode();
    const email_verification_code_hash = await hashPassword(verificationCode);
    const email_verification_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password_hash,
        name,
        role,
        customer_id: customer.id,
        email_verified: false,
        email_verification_code_hash,
        email_verification_expires_at,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        is_verified: users.is_verified,
        email_verified: users.email_verified,
      });

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message: "Registration successful. Verification code sent to email.",
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= VERIFY EMAIL =================
authRouter.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "email and code are required",
      });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (
      !user.email_verification_code_hash ||
      !user.email_verification_expires_at
    ) {
      return res.status(400).json({ message: "No verification code found" });
    }

    if (new Date() > new Date(user.email_verification_expires_at)) {
      return res.status(400).json({ message: "Verification code expired" });
    }

    const isMatch = await comparePassword(
      code,
      user.email_verification_code_hash,
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    await db
      .update(users)
      .set({
        email_verified: true,
        email_verification_code_hash: null,
        email_verification_expires_at: null,
      })
      .where(eq(users.id, user.id));

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGIN =================
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(401).json({ message: "User does not exist" });
    }

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    delete (user as any).password_hash;
    delete (user as any).email_verification_code_hash;

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 3600000,
    });

    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGOUT =================
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

// ================= ADMIN: GET ALL USERS =================
authRouter.get("/admin/users", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);

    if (!authUser || authUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        is_verified: users.is_verified,
        email_verified: users.email_verified,
      })
      .from(users)
      .orderBy(asc(users.id));

    res.json({ users: allUsers });
  } catch (err) {
    console.error("Admin get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ADMIN: DELETE USER =================
authRouter.delete("/admin/users/:id", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);
    const userId = Number(req.params.id);

    if (!authUser || authUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (Number(authUser.id) === userId) {
      return res
        .status(400)
        .json({ message: "Admin cannot delete their own account" });
    }

    const existing = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all listings owned by this user
    const ownedListings = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.seller_id, userId));

    const ownedListingIds = ownedListings.map((l) => l.id);

    // Get all vehicles owned by this user
    const ownedVehicles = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.user_id, userId));

    const ownedVehicleIds = ownedVehicles.map((v) => v.id);

    // ========== DELETION ORDER (respecting FK constraints) ==========
    // 1. Delete listing interactions (references user_id and listing_id)
    await db.delete(listingInteractions).where(eq(listingInteractions.user_id, userId));
    if (ownedListingIds.length > 0) {
      await db
        .delete(listingInteractions)
        .where(inArray(listingInteractions.listing_id, ownedListingIds));
    }

    // 2. Delete bids (references bidder_id and listing_id)
    await db.delete(bids).where(eq(bids.bidder_id, userId));
    if (ownedListingIds.length > 0) {
      await db.delete(bids).where(inArray(bids.listing_id, ownedListingIds));
    }

    // 3. Delete transactions (references buyer_id, seller_id, and listing_id)
    await db.delete(transactions).where(eq(transactions.buyer_id, userId));
    await db.delete(transactions).where(eq(transactions.seller_id, userId));
    if (ownedListingIds.length > 0) {
      await db
        .delete(transactions)
        .where(inArray(transactions.listing_id, ownedListingIds));
    }

    // 4. Delete listings (references seller_id and vehicle_id)
    if (ownedListingIds.length > 0) {
      await db.delete(listings).where(inArray(listings.id, ownedListingIds));
    }

    // 5. Delete vehicles (references user_id)
    if (ownedVehicleIds.length > 0) {
      await db.delete(vehicles).where(inArray(vehicles.id, ownedVehicleIds));
    }

    // 6. Finally delete the user
    await db.delete(users).where(eq(users.id, userId));

    res.json({ message: "User and all associated data deleted successfully" });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= CHECK =================

authRouter.get("/check", requireAuth, async (req, res) => {
  try {
    const decodedUser = (req as any).user;
    // Fetch fresh user data from database to get latest is_verified status
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        is_verified: users.is_verified,
      })
      .from(users)
      .where(eq(users.id, decodedUser.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Check error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
