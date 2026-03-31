import { Router } from "express";
import { db } from "../db/db";
import { eq, ne, and, desc, count, sql } from "drizzle-orm";
import { listings, vehicles, bids, transactions } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

export const auctionRouter = Router();

async function getAuthUser(req: any, res: any) {
  await new Promise<void>((resolve) => {
    requireAuth(req, res, () => resolve());
  });

  return req.user;
}

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
    const authUser = await getAuthUser(req, res);
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (authUser.role !== "admin" && Number(authUser.id) !== id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this user's bids" });
    }

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
   GET /api/listings/bids/user/:id --> Get all bids placed by a user (excluding cancelled listings)
------------------------------------------------ */
auctionRouter.get("/bids/user/:id", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (authUser.role !== "admin" && Number(authUser.id) !== id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this user's bids" });
    }

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

    const rows = await db
      .select({ listing: listings, vehicle: vehicles })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(eq(listings.vehicle_id, id));

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Listings not found" });
    }

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

/* ----------------------------------------------
   GET /api/listings/user/:id --> Get listings by seller/user id
------------------------------------------------ */
auctionRouter.get("/user/:id", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (authUser.role !== "admin" && Number(authUser.id) !== id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this user's listings" });
    }

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
  POST /api/listings/create --> Create listing
------------------------------------------------ */
auctionRouter.post("/create", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);

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
      latitude,
      longitude,
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

    if (
      authUser.role !== "admin" &&
      Number(authUser.id) !== Number(seller_id)
    ) {
      return res.status(403).json({
        message: "Not authorized to create a listing for this seller",
      });
    }

    const [newListing] = await db
      .insert(listings)
      .values([
        {
          vehicle_id: Number(vehicle_id),
          seller_id: Number(seller_id),
          type,
          start_price,
          reserve_price,
          buy_now_price,
          current_price: start_price,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          status: "active",
          views_count: 0,
          location,
          latitude,
          longitude,
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
  DELETE /api/listings/remove/:id --> Cancel listing
------------------------------------------------ */
auctionRouter.delete("/remove/:id", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);
    const listingId = Number(req.params.id);

    const row = await db
      .select({
        id: listings.id,
        seller_id: listings.seller_id,
      })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!row.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listing = row[0];

    if (
      authUser.role !== "admin" &&
      !(
        authUser.role === "seller" &&
        Number(authUser.id) === Number(listing.seller_id)
      )
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this listing" });
    }

    await db
      .update(listings)
      .set({ status: "cancelled" })
      .where(eq(listings.id, listingId));

    res.json({ message: "Auction cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
  GET /api/listings/admin/all --> Admin gets ALL listings
------------------------------------------------ */
auctionRouter.get("/admin/all", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);

    if (!authUser || authUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const bidsCountSubquery = db
      .select({
        listing_id: bids.listing_id,
        bid_count: count().as("bid_count"),
      })
      .from(bids)
      .groupBy(bids.listing_id)
      .as("bstats");

    const rows = await db
      .select({
        listing: listings,
        vehicle: vehicles,
        bids_count: sql<number>`COALESCE(${bidsCountSubquery.bid_count}, 0)`,
      })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .leftJoin(
        bidsCountSubquery,
        eq(bidsCountSubquery.listing_id, listings.id),
      );

    const result = rows.map(({ listing, vehicle, bids_count }) => ({
      ...listing,
      vehicle,
      bids_count: Number(bids_count),
    }));

    res.json({ listings: result });
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
    const bidsCountSubquery = db
      .select({
        listing_id: bids.listing_id,
        bid_count: count().as("bid_count"),
      })
      .from(bids)
      .groupBy(bids.listing_id)
      .as("bstats");

    const rows = await db
      .select({
        listing: listings,
        vehicle: vehicles,
        bids_count: sql<number>`COALESCE(${bidsCountSubquery.bid_count}, 0)`,
      })
      .from(listings)
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .leftJoin(
        bidsCountSubquery,
        eq(bidsCountSubquery.listing_id, listings.id),
      )
      .where(ne(listings.status, "cancelled"));

    const result = rows.map(({ listing, vehicle, bids_count }) => ({
      ...listing,
      vehicle,
      bids_count: Number(bids_count),
    }));

    res.json({ listings: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/transactions/check/:listingId/:userId
------------------------------------------------ */
auctionRouter.get(
  "/transactions/check/:listingId/:userId",
  async (req, res) => {
    try {
      const listingId = Number(req.params.listingId);
      const userId = Number(req.params.userId);

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

/* ----------------------------------------------
   POST /api/listings/:listingId/sale --> Complete sale
------------------------------------------------ */
auctionRouter.post("/:listingId/sale", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);
    const listingId = Number(req.params.listingId);

    const ownerRow = await db
      .select({
        id: listings.id,
        seller_id: listings.seller_id,
      })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!ownerRow.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listing = ownerRow[0];

    if (
      authUser.role !== "admin" &&
      !(
        authUser.role === "seller" &&
        Number(authUser.id) === Number(listing.seller_id)
      )
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to complete this sale" });
    }

    await db
      .update(listings)
      .set({ status: "sold" })
      .where(eq(listings.id, listingId));

    const [row] = await db
      .select({
        currentPrice: listings.current_price,
        sellerId: listings.seller_id,
      })
      .from(listings)
      .where(eq(listings.id, listingId));

    const [row1] = await db
      .select({
        buyerId: bids.bidder_id,
      })
      .from(bids)
      .where(eq(bids.listing_id, listingId))
      .orderBy(desc(bids.bid_time))
      .limit(1);

    await db.insert(transactions).values({
      buyer_id: Number(row1.buyerId),
      seller_id: Number(row.sellerId),
      listing_id: listingId,
      final_price: row.currentPrice,
      payment_status: "pending",
      created_at: new Date(Date.now()),
    });

    res.json({ message: "Sale completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/listings/:id --> Get listing based on id
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
