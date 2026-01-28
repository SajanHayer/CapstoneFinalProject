import { Router } from "express";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { listings } from "../db/schema";

export const auctionRouter = Router();

/* ----------------------------------------------
   GET /api/listings/:id  → Get listing based on id
------------------------------------------------ */
auctionRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id));
    if (!listing) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/user/:id  → Get listing based on id
------------------------------------------------ */
auctionRouter.get("/user/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userListings = await db
      .select()
      .from(listings)
      .where(eq(listings.seller_id, id));

    if (!userListings) {
      return res.status(404).json({ message: "Listings not found for user" });
    }
    res.json({ userListings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
