import { Router } from "express";
import { db } from "../db/db";
import { eq, ne, and, desc } from "drizzle-orm";
import { listings, vehicles, bids, transactions } from "../db/schema";
import { authRouter } from "./authRoutes";

export const auctionRouter = Router();

/* ===== IMPORTANT: More specific routes MUST come FIRST ===== */

/* ----------------------------------------------
   GET /api/listings/:id/all/bids --> Get all bids for a specific listing
------------------------------------------------ */
auctionRouter.get("/:id/all/bids", async (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const bidList = await db
      .select()
      .from(bids)
      .where(eq(bids.listing_id, listingId));

    res.json({ result: bidList });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/:id/bids --> Get all bids for a specific listing (only if listing is not cancelled)
------------------------------------------------ */
auctionRouter.get("/:id/bids", async (req, res) => {
  try {
    const listingId = Number(req.params.id);

    const bidList = await db
      .select({
        bid: bids,
        listingStatus: listings.status,
      })
      .from(bids)
      .innerJoin(listings, eq(listings.id, bids.listing_id))
      .where(
        and(eq(bids.listing_id, listingId), ne(listings.status, "cancelled")),
      );

    // console.log(bidList);
    res.json({ result: bidList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/bids/user/all/:id --> Get all bids placed by a user
------------------------------------------------ */
auctionRouter.get("/bids/user/all/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Fetch all bids for the user with listing and vehicle info
    const rows = await db
      .select({
        bid: bids,
        listing: listings,
        vehicle: vehicles,
      })
      .from(bids)
      .leftJoin(listings, eq(listings.id, bids.listing_id))
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(eq(bids.bidder_id, id));

    if (!rows || rows.length === 0) {
      return res.json({ result: [] });
    }

    const result = rows.map((row) => ({
      ...row.bid,
      listing: row.listing,
      vehicle: row.vehicle,
    }));

    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/bids/user/:id --> Get all bids placed by a user (exluding cancelled listings)
------------------------------------------------ */
auctionRouter.get("/bids/user/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Fetch all bids for the user with listing and vehicle info
    const rows = await db
      .select({
        bid: bids,
        listing: listings,
        vehicle: vehicles,
      })
      .from(bids)
      .leftJoin(listings, eq(listings.id, bids.listing_id))
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(and(eq(bids.bidder_id, id), ne(listings.status, "cancelled")));
    if (!rows || rows.length === 0) {
      return res.json({ result: [] });
    }

    const result = rows.map((row) => ({
      ...row.bid,
      listing: row.listing,
      vehicle: row.vehicle,
    }));

    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/vehicle/all/:id --> Get ALL listings for a vehicle
------------------------------------------------ */
auctionRouter.get("/vehicle/all/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Fetch ALL listings with their vehicles
    const rows = await db
      .select({ listing: listings, vehicle: vehicles })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(eq(listings.vehicle_id, id));

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Listings not found" });
    }

    // Merge listings + vehicle into array of objects
    const result = rows.map((row) => ({
      ...row.listing,
      vehicle: row.vehicle,
    }));
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/vehicle/:id --> Get ALL listings for a vehicle (with cancelled listings excluded)
------------------------------------------------ */
auctionRouter.get("/vehicle/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Fetch ALL listings with their vehicles
    const rows = await db
      .select({ listing: listings, vehicle: vehicles })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(
        and(eq(listings.vehicle_id, id), ne(listings.status, "cancelled")),
      );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Listings not found" });
    }

    // Merge listings + vehicle into array of objects
    const result = rows.map((row) => ({
      ...row.listing,
      vehicle: row.vehicle,
    }));
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ===== General routes follow ===== */

// /* ----------------------------------------------
//    GET /api/listings/vehicle/:id --> Get first listing for a vehicle
// ------------------------------------------------ */
// auctionRouter.get("/vehicle/:id", async (req, res) => {
//   try {
//     const id = Number(req.params.id);
//     // Fetch single listing with its vehicle
//     const row = await db
//       .select({ listing: listings, vehicle: vehicles })
//       .from(listings)
//       .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
//       .where(eq(listings.vehicle_id, id))
//       .limit(1);

//     if (!row || row.length === 0) {
//       return res.status(404).json({ message: "Listing not found" });
//     }

//     // Merge listing + vehicle into one object
//     const result = {
//       ...row[0].listing,
//       vehicle: row[0].vehicle,
//     };
//     res.json({ result });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

/* ----------------------------------------------
   GET /api/listings/user/:id --> Get listings by seller/user id
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
  REMOVE /api/listings/remove/:id --> Remove listing based of id and vehilce id
------------------------------------------------ */

auctionRouter.delete("/remove/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db
      .update(listings)
      .set({ status: "cancelled" }) // or "ended"
      .where(eq(listings.id, Number(id)));

    res.json({ message: "Auction cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
  GET /api/listings --> Get all listings
------------------------------------------------ */
auctionRouter.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select({
        listing: listings,
        vehicle: vehicles,
      })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(ne(listings.status, "cancelled"));
    const result = rows.map(({ listing, vehicle }) => ({
      ...listing,
      vehicle,
    }));
    // console.log({listings: result});
    res.json({ listings: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

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

// check for transaction
auctionRouter.get(
  "/transactions/check/:listingId/:userId",
  async (req, res) => {
    try {
      const listingId = Number(req.params.listingId);
      const userId = Number(req.params.userId);

      // Check if user has won this listing
      const findTransaction = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.listing_id, listingId),
            eq(transactions.buyer_id, userId),
          ),
        )
        .limit(1);
      if (findTransaction && findTransaction.length > 0) {
        return res.json({
          eligible: true,
          message: "User has won this listing",
        });
      }

      res.json({ eligible: false });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// complete sale
auctionRouter.post("/:listingId/sale", async (req, res) => {
  try {
    const listingId = Number(req.params.listingId);
    // Logic to complete the sale, e.g. update listing status, create transaction record, etc.
    const test = await db
      .update(listings)
      .set({ status: "sold" })
      .where(eq(listings.id, listingId));

    // get current price and seller id
    const [row] = await db
      .select({
        currentPrice: listings.current_price,
        sellerId: listings.seller_id,
      })
      .from(listings)
      .where(eq(listings.id, listingId));

    console.log(row);

    // get bidder id
    const [row1] = await db
      .select({
        buyerId: bids.bidder_id,
      })
      .from(bids)
      .where(eq(bids.listing_id, listingId))
      .orderBy(desc(bids.bid_time))
      .limit(1);

    await db
      .insert(transactions)
      .values({
        buyer_id: Number(row1.buyerId),
        seller_id: Number(row.sellerId),
        listing_id: listingId,
        final_price: row.currentPrice,
        payment_status: "pending",
        created_at: new Date(Date.now()),
      })
      .returning();

    res.json({ message: "Sale completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
