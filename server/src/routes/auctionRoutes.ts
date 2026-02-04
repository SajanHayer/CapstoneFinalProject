import { Router } from "express";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { listings, vehicles } from "../db/schema";

export const auctionRouter = Router();

/* ----------------------------------------------
   GET /api/listings/:id  --> Get listing based on id
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
   GET /api/listings/vehicle/:id --> Get listing based on vehicle id
------------------------------------------------ */
auctionRouter.get("/vehicle/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Fetch single listing with its vehicle
    const row = await db
      .select({ listing: listings, vehicle: vehicles })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(eq(listings.vehicle_id, id))
      .limit(1); // optional, ensures a single result

    if (!row || row.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Merge listing + vehicle into one object
    const result = {
      ...row[0].listing,
      vehicle: row[0].vehicle,
    };
    // console.log(result);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/user/:id --> Get listing based on user id
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
  POST /api/listings/create/:id --> Get listing based on user id
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
      location,
    } = req.body;

    if (
      !vehicle_id ||
      !seller_id ||
      !type ||
      !start_price ||
      !start_time ||
      !end_time ||
      !location
    ) {
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

/* ----------------------------------------------
  GET /api/listings --> Get all listings
------------------------------------------------ */

auctionRouter.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        listing: listings,
        vehicle: vehicles,
      })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id));
    const result = rows.map(({ listing, vehicle }) => ({
      ...listing,
      vehicle, // nested, clean, JSON-safe
    }));
    // console.log({listings: result});
    res.json({ listings: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
