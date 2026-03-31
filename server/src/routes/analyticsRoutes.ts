import { Router } from "express";
import { query } from "../db/db";
import { requireAuth } from "../middleware/requireAuth";

export const analyticsRouter = Router();

/**
 * GET /api/analytics/bids/summary
 *
 * Scope rules:
 * - guest: global demo analytics
 * - seller: only their own listings
 * - admin: full platform analytics
 *
 * Sensitive personal bidder info is NOT returned.
 */
analyticsRouter.get("/bids/summary", async (req, res) => {
  let authUser: any = null;
  let sellerId: number | null = null;
  let scope: "global" | "seller" | "admin" = "global";

  try {
    await new Promise<void>((resolve) => {
      requireAuth(req, res, () => resolve());
    });

    authUser = (req as any).user;

    if (authUser?.role === "seller" && authUser?.id) {
      sellerId = Number(authUser.id);
      scope = "seller";
    } else if (authUser?.role === "admin") {
      scope = "admin";
    }
  } catch {
    authUser = null;
    sellerId = null;
    scope = "global";
  }

  try {
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

    const recentBidsResult = await query(
      `
      SELECT
        b.id::int AS id,
        b.listing_id::int AS listing_id,
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

    return res.json({
      scope,
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
        bidAmount: Number(r.bid_amount),
        bidTime: r.bid_time,
        location: r.location,
        bidderId: null,
      })),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});