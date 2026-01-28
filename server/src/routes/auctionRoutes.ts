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
   GET /api/listings/user/:id  → Get listing based on user id
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

/* ----------------------------------------------
  POST /api/listings/create/:id  → Get listing based on user id
------------------------------------------------ */

auctionRouter.post("/create", async (req, res) => {
  try {
    const {
      vehicle_id,
      seller_id,
      type,
      start_price,
      reserve_price,
      buy_now_price,
      start_time,
      end_time,
      location
    } = req.body;

    if (!vehicle_id || !seller_id || !type || !start_price || !start_time || !end_time || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const [newListing] = await db
      .insert(listings)
      .values([
        {
          vehicle_id: Number(vehicle_id),
          seller_id: Number(seller_id),
          type,
          start_price: start_price,
          reserve_price: reserve_price,
          buy_now_price: buy_now_price,
          current_price: start_price,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          status: "active",
          views_count: 0,
          location,
        },
      ])
      .returning();
      res.status(201).json({ listing: newListing });
      
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});