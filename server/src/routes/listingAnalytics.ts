import { Router } from "express";
import { db } from "../db/db";
import { eq, asc } from "drizzle-orm";
import { listings, vehicles, bids, users } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

async function getAuthUser(req: any, res: any) {
  await new Promise<void>((resolve, reject) => {
    requireAuth(req, res, () => resolve());
  });

  return req.user;
}

/**
 * GET /api/listings-analytics/:listingId
 * Seller -> only own listing
 * Admin  -> any listing
 */
router.get("/:listingId", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);

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

    const row = rows[0];

    if (
      authUser.role !== "admin" &&
      !(
        authUser.role === "seller" &&
        Number(authUser.id) === Number(row.seller_id)
      )
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this listing analytics" });
    }

    return res.json({
      result: {
        ...row,
        admin_view: authUser.role === "admin",
      },
    });
  } catch (e) {
    console.error("GET listing analytics error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/listings-analytics/:listingId/bids
 * Seller -> only own listing
 * Admin  -> any listing
 * Bidder personal info is always hidden
 */
router.get("/:listingId/bids", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);

    const listingId = Number(req.params.listingId);
    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const ownerRows = await db
      .select({
        listing_id: listings.id,
        seller_id: listings.seller_id,
      })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (ownerRows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listingRow = ownerRows[0];

    if (
      authUser.role !== "admin" &&
      !(
        authUser.role === "seller" &&
        Number(authUser.id) === Number(listingRow.seller_id)
      )
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view bids for this listing" });
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
          r.bid_time instanceof Date
            ? r.bid_time.toISOString()
            : String(r.bid_time),
        bidderId: r.bidder_id,
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
 * Seller -> only own listing
 * Admin  -> any listing
 */
router.patch("/:listingId", async (req, res) => {
  try {
    const authUser = await getAuthUser(req, res);

    const listingId = Number(req.params.listingId);
    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const ownerRows = await db
      .select({
        listing_id: listings.id,
        seller_id: listings.seller_id,
        vehicle_id: listings.vehicle_id,
      })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (ownerRows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listingRow = ownerRows[0];

    if (
      authUser.role !== "admin" &&
      !(
        authUser.role === "seller" &&
        Number(authUser.id) === Number(listingRow.seller_id)
      )
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this listing" });
    }

    const { description, end_time, reserve_price, buy_now_price, location } =
      req.body ?? {};

    const start_price1 =
      reserve_price !== undefined && reserve_price !== null
        ? Number(reserve_price) * 0.75
        : null;

    await db
      .update(listings)
      .set({
        end_time: end_time ? new Date(end_time) : undefined,
        start_price: start_price1 !== null ? String(start_price1) : undefined,
        current_price: start_price1 !== null ? String(start_price1) : undefined,
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

    if (typeof description === "string") {
      await db
        .update(vehicles)
        .set({ description })
        .where(eq(vehicles.id, listingRow.vehicle_id));
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