import { db } from "../db/db";
import { listingInteractions, listings } from "../db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { query } from "../db/db";

type RecommendationHistoryRow = {
  listing_id: number;
  interaction_score: number;
  type: string;
  location: string | null;
  price: number;
  make: string;
  model: string;
  condition: string;
  year: number;
  views_count: number;
  bid_count: number;
};

type CandidateRow = {
  listing_id: number;
  type: string;
  location: string | null;
  price: number;
  make: string;
  model: string;
  condition: string;
  year: number;
  views_count: number;
  bid_count: number;
  image_url: string[] | string | null;
  start_time: string;
  end_time: string;
};

export type RecommendationResponse = {
  listingId: number;
  score: number;
  behaviorScore: number;
  contentScore: number;
  popularityScore: number;
  explanations: string[];
};

const RECOMMENDER_URL =
  process.env.RECOMMENDER_URL || "http://localhost:5000";

function coerceImageUrl(value: CandidateRow["image_url"]): string {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        return parsed[0];
      }
    } catch {
      return value;
    }
  }

  return "";
}

async function getViewHistory(userId: number): Promise<RecommendationHistoryRow[]> {
  const result = await query(
    `
      SELECT
        li.listing_id::int AS listing_id,
        1.25 AS interaction_score,
        l.type::text AS type,
        l.location AS location,
        l.current_price::float8 AS price,
        v.make AS make,
        v.model AS model,
        v.condition::text AS condition,
        v.year::int AS year,
        l.views_count::int AS views_count,
        COALESCE(bstats.bid_count, 0)::int AS bid_count
      FROM listing_interactions li
      JOIN listings l ON l.id = li.listing_id
      JOIN vehicles v ON v.id = l.vehicle_id
      LEFT JOIN (
        SELECT listing_id, COUNT(*)::int AS bid_count
        FROM bids
        GROUP BY listing_id
      ) bstats ON bstats.listing_id = l.id
      WHERE li.user_id = $1
        AND li.interaction_type = 'view'
      ORDER BY li.occurred_at DESC
      LIMIT 25
    `,
    [userId],
  );

  return result.rows as RecommendationHistoryRow[];
}

async function getBidHistory(userId: number): Promise<RecommendationHistoryRow[]> {
  const result = await query(
    `
      SELECT
        b.listing_id::int AS listing_id,
        (2.5 + COUNT(*)::float8 * 0.5) AS interaction_score,
        l.type::text AS type,
        l.location AS location,
        l.current_price::float8 AS price,
        v.make AS make,
        v.model AS model,
        v.condition::text AS condition,
        v.year::int AS year,
        l.views_count::int AS views_count,
        COUNT(*)::int AS bid_count
      FROM bids b
      JOIN listings l ON l.id = b.listing_id
      JOIN vehicles v ON v.id = l.vehicle_id
      WHERE b.bidder_id = $1
      GROUP BY
        b.listing_id,
        l.type,
        l.location,
        l.current_price,
        v.make,
        v.model,
        v.condition,
        v.year,
        l.views_count
      ORDER BY MAX(b.bid_time) DESC
      LIMIT 25
    `,
    [userId],
  );

  return result.rows as RecommendationHistoryRow[];
}

async function getCandidateListings(userId: number): Promise<CandidateRow[]> {
  const result = await query(
    `
      SELECT
        l.id::int AS listing_id,
        l.type::text AS type,
        l.location AS location,
        l.current_price::float8 AS price,
        v.make AS make,
        v.model AS model,
        v.condition::text AS condition,
        v.year::int AS year,
        l.views_count::int AS views_count,
        COALESCE(bstats.bid_count, 0)::int AS bid_count,
        v.image_url AS image_url,
        l.start_time::text AS start_time,
        l.end_time::text AS end_time
      FROM listings l
      JOIN vehicles v ON v.id = l.vehicle_id
      LEFT JOIN (
        SELECT listing_id, COUNT(*)::int AS bid_count
        FROM bids
        GROUP BY listing_id
      ) bstats ON bstats.listing_id = l.id
      WHERE l.status = 'active'
        AND l.seller_id <> $1
      ORDER BY l.end_time ASC
    `,
    [userId],
  );

  return result.rows as CandidateRow[];
}

export async function trackListingView(userId: number, listingId: number) {
  const lookback = new Date(Date.now() - 1000 * 60 * 60 * 4);
  const existing = await db
    .select({ id: listingInteractions.id })
    .from(listingInteractions)
    .where(
      and(
        eq(listingInteractions.user_id, userId),
        eq(listingInteractions.listing_id, listingId),
        eq(listingInteractions.interaction_type, "view"),
        gte(listingInteractions.occurred_at, lookback),
      ),
    )
    .orderBy(desc(listingInteractions.occurred_at))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(listingInteractions).values({
      user_id: userId,
      listing_id: listingId,
      interaction_type: "view",
    });
  
    await db
      .update(listings)
      .set({
        views_count: sql`${listings.views_count} + 1`,
      })
      .where(eq(listings.id, listingId));
  }
}

export async function trackBidInteraction(userId: number, listingId: number) {
  await db.insert(listingInteractions).values({
    user_id: userId,
    listing_id: listingId,
    interaction_type: "bid",
  });
}

type RankedListing = CandidateRow & RecommendationResponse;

export async function getRecommendationsForUser(
  userId: number,
  limit = 6,
): Promise<RankedListing[]> {
  const [viewHistory, bidHistory, candidates] = await Promise.all([
    getViewHistory(userId),
    getBidHistory(userId),
    getCandidateListings(userId),
  ]);
  // console.log("HISTORY:", viewHistory, bidHistory);
  // console.log("CANDIDATES:", candidates.length);


  if (candidates.length === 0) {
    return [];
  }

  const payload = {
    user_id: userId,
    history: [...viewHistory, ...bidHistory],
    candidates,
    limit,
  };
  // console.log("PAYLOAD:", JSON.stringify(payload, null, 2));

  let recommendations: RecommendationResponse[] = [];

  try {
    const response = await fetch(`${RECOMMENDER_URL}/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Recommendation service returned ${response.status}`);
    }

    const data = (await response.json()) as { recommendations?: Array<any> };
    recommendations = Array.isArray(data?.recommendations)
      ? data.recommendations.map((item: any) => ({
          listingId: Number(item.listing_id),
          score: Number(item.score ?? 0),
          behaviorScore: Number(item.behavior_score ?? 0),
          contentScore: Number(item.content_score ?? 0),
          popularityScore: Number(item.popularity_score ?? 0),
          explanations: Array.isArray(item.explanations)
            ? item.explanations.map(String)
            : [],
        }))
      : [];
  } catch (error) {
    console.error("[Recommendations] Service unavailable, falling back to popularity", error);
    recommendations = candidates
      .sort((a, b) => b.bid_count + b.views_count - (a.bid_count + a.views_count))
      .slice(0, limit)
      .map((candidate) => ({
        listingId: candidate.listing_id,
        score: 0.5,
        behaviorScore: 0,
        contentScore: 0,
        popularityScore: 0.5,
        explanations: [
          "Fallback recommendation based on live marketplace popularity",
        ],
      }));
  }

  const candidateMap = new Map(candidates.map((candidate) => [candidate.listing_id, candidate]));

  return recommendations
    .map((recommendation) => {
      const candidate = candidateMap.get(recommendation.listingId);
      if (!candidate) return null;
      return {
        ...candidate,
        ...recommendation,
      };
    })
    .filter((item): item is RankedListing => item !== null);
}

export function toRecommendationCard(listing: RankedListing) {
  const now = new Date();
  const startTime = new Date(listing.start_time);
  const endTime = new Date(listing.end_time);

  const status =
    now < startTime
      ? "UPCOMING"
      : now >= startTime && now < endTime
        ? "ACTIVE"
        : "EXPIRED";

  return {
    id: String(listing.listing_id),
    title: `${listing.year} ${listing.make} ${listing.model}`,
    thumbnailUrl: coerceImageUrl(listing.image_url),
    currentPrice: Number(listing.price),
    location: listing.location || "Unknown",
    mileage: 0,
    year: Number(listing.year),
    status,
    startsAt: listing.start_time,
    endsAt: listing.end_time,
    bids: Number(listing.bid_count),
    recommendationScore: listing.score,
    behaviorScore: listing.behaviorScore,
    contentScore: listing.contentScore,
    popularityScore: listing.popularityScore,
    explanations: listing.explanations,
  };
}
