import { Router } from "express";
import { db } from "../db/db";
import { listings, vehicles, bids, users } from "../db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

/**
 * GET /api/listings-analytics/:listingId
 * Returns listing + vehicle summary for analytics/edit pages
 */
router.get("/:listingId", async (req, res) => {
  try {
    const listingId = Number(req.params.listingId);
    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const rows = await db
      .select({
        listing_id: listings.id,
        seller_id: listings.seller_id,
        vehicle_id: listings.vehicle_id,
        start_price: listings.start_price,
        reserve_price: listings.reserve_price,
        buy_now_price: listings.buy_now_price,
        current_price: listings.current_price,
        start_time: listings.start_time,
        end_time: listings.end_time,
        status: listings.status,
        views_count: listings.views_count,
        location: listings.location,

        year: vehicles.year,
        make: vehicles.make,
        model: vehicles.model,
        description: vehicles.description,
      })
      .from(listings)
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
      .where(eq(listings.id, listingId))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.json({ result: rows[0] });
  } catch (e) {
    console.error("GET listing analytics error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/listings-analytics/:listingId/bids
 * Returns bid timeline + bidder info
 */
router.get("/:listingId/bids", async (req, res) => {
  try {
    const listingId = Number(req.params.listingId);
    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const rows = await db
      .select({
        bid_amount: bids.bid_amount,
        bid_time: bids.bid_time,
        bidder_id: bids.bidder_id,
        bidder_name: users.name,
      })
      .from(bids)
      .innerJoin(users, eq(users.id, bids.bidder_id))
      .where(eq(bids.listing_id, listingId))
      .orderBy(asc(bids.bid_time));

    return res.json({
      result: rows.map((r) => ({
        amount: Number(r.bid_amount),
        createdAt:
          r.bid_time instanceof Date ? r.bid_time.toISOString() : String(r.bid_time),
        bidderId: Number(r.bidder_id),
        bidderName: r.bidder_name,
      })),
    });
  } catch (e: any) {
    console.error("BIDS ROUTE ERROR:", e);
    return res.status(500).json({
      error: "Server error",
      message: e?.message ?? String(e),
    });
  }
});

/**
 * PATCH /api/listings-analytics/:listingId
 * Allows editing SAFE fields only:
 * - vehicle description
 * - listing end_time
 * - reserve_price
 * - buy_now_price
 * - location
 *
 * Does NOT allow make/model/year edits.
 */
router.patch("/:listingId", async (req, res) => {
  try {
    const listingId = Number(req.params.listingId);
    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const { description, end_time, reserve_price, buy_now_price, location } =
      req.body ?? {};

    // Update listing fields
    await db
      .update(listings)
      .set({
        end_time: end_time ? new Date(end_time) : undefined,
        reserve_price:
          reserve_price !== undefined && reserve_price !== null
            ? String(reserve_price)
            : undefined,
        buy_now_price:
          buy_now_price === null
            ? null
            : buy_now_price !== undefined
              ? String(buy_now_price)
              : undefined,
        location: location !== undefined ? String(location) : undefined,
      })
      .where(eq(listings.id, listingId));

    // Update vehicle description if provided
    if (typeof description === "string") {
      const row = await db
        .select({ vehicle_id: listings.vehicle_id })
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      const vehicleId = row[0]?.vehicle_id;
      if (vehicleId) {
        await db
          .update(vehicles)
          .set({ description })
          .where(eq(vehicles.id, vehicleId));
      }
    }

    return res.json({ success: true });
  } catch (e: any) {
    console.error("PATCH LISTING ERROR:", e);
    return res.status(500).json({
      error: "Server error",
      message: e?.message ?? String(e),
    });
  }
});

export default router;
