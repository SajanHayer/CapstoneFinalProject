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
    // here we will call the db to get listing details based on vehicleId and listing id
    // test db call figure out how we want to get the infor from the database
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   POST /api/listings/:id  → Get listing based on id
------------------------------------------------ */
