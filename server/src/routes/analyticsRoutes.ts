import { Router } from "express";
import { query } from "../db/db";
import { requireAuth } from "../middleware/requireAuth";

export const analyticsRouter = Router();

/**
 * GET /api/analytics/bids/summary
 *
 * If the request is authenticated and the user is a seller/admin, the response
 * is scoped to that seller's listings.
 *
 * Otherwise, it returns a global summary (useful for Guest/Demo mode).
 */
analyticsRouter.get("/bids/summary", async (req, res) => {
  // Auth is optional here (guest can view demo analytics).
  // We'll try to decode the cookie if present, but we won't block.
  let sellerId: number | null = null;
  try {
    // requireAuth throws/returns response; we can't call it directly.
    // Instead, we check if a cookie exists and, if so, verify via a tiny middleware call.
    // The simplest approach in this codebase: attempt a protected fetch path via jwt verification.
    // We'll reuse requireAuth but capture the result by invoking it manually.
    await new Promise<void>((resolve, reject) => {
      // @ts-ignore
      requireAuth(req, res, () => resolve());
    });

    const u = (req as any).user;
    if (u?.id && (u?.role === "seller" || u?.role === "admin")) {
      sellerId = Number(u.id);
    }
  } catch {
    sellerId = null;
  }

  try {
    // Totals
    const totalsResult = await query(
      `
      SELECT
        COUNT(*)::int AS bid_count,
        COUNT(DISTINCT bidder_id)::int AS unique_bidders,
        COALESCE(SUM(bid_amount), 0)::numeric AS total_bid_volume,
        COALESCE(AVG(bid_amount), 0)::numeric AS avg_bid_amount
      FROM bids b
      ${sellerId ? "JOIN listings l ON l.id = b.listing_id" : ""}
      ${sellerId ? "WHERE l.seller_id = $1" : ""}
      `,
      sellerId ? [sellerId] : undefined,
    );

    const totals = totalsResult.rows?.[0] ?? {
      bid_count: 0,
      unique_bidders: 0,
      total_bid_volume: 0,
      avg_bid_amount: 0,
    };

    // Per-listing rollups
    const byListingResult = await query(
      `
      SELECT
        b.listing_id::int AS listing_id,
        COUNT(*)::int AS bid_count,
        COUNT(DISTINCT b.bidder_id)::int AS unique_bidders,
        COALESCE(MAX(b.bid_amount), 0)::numeric AS max_bid,
        COALESCE(AVG(b.bid_amount), 0)::numeric AS avg_bid,
        MAX(b.bid_time) AS last_bid_time
      FROM bids b
      ${sellerId ? "JOIN listings l ON l.id = b.listing_id" : ""}
      ${sellerId ? "WHERE l.seller_id = $1" : ""}
      GROUP BY b.listing_id
      ORDER BY max_bid DESC
      LIMIT 20
      `,
      sellerId ? [sellerId] : undefined,
    );

    // Recent bids
    const recentBidsResult = await query(
      `
      SELECT
        b.id::int AS id,
        b.listing_id::int AS listing_id,
        b.bidder_id::int AS bidder_id,
        b.bid_amount::numeric AS bid_amount,
        b.bid_time AS bid_time,
        b.location AS location
      FROM bids b
      ${sellerId ? "JOIN listings l ON l.id = b.listing_id" : ""}
      ${sellerId ? "WHERE l.seller_id = $1" : ""}
      ORDER BY b.bid_time DESC
      LIMIT 25
      `,
      sellerId ? [sellerId] : undefined,
    );

    res.json({
      scope: sellerId ? "seller" : "global",
      totals: {
        bidCount: Number(totals.bid_count ?? 0),
        uniqueBidders: Number(totals.unique_bidders ?? 0),
        totalBidVolume: Number(totals.total_bid_volume ?? 0),
        avgBidAmount: Number(totals.avg_bid_amount ?? 0),
      },
      byListing: byListingResult.rows.map((r) => ({
        listingId: Number(r.listing_id),
        bidCount: Number(r.bid_count),
        uniqueBidders: Number(r.unique_bidders),
        maxBid: Number(r.max_bid),
        avgBid: Number(r.avg_bid),
        lastBidTime: r.last_bid_time,
      })),
      recentBids: recentBidsResult.rows.map((r) => ({
        id: Number(r.id),
        listingId: Number(r.listing_id),
        bidderId: Number(r.bidder_id),
        bidAmount: Number(r.bid_amount),
        bidTime: r.bid_time,
        location: r.location,
      })),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
