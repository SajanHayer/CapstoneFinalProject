import { db } from "../db/db";
import { listingInteractions, listings, vehicles, bids } from "../db/schema";
import { and, desc, eq, gte, sql, count, asc } from "drizzle-orm";

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
  start_time: Date;
  end_time: Date;
};

export type RecommendationResponse = {
  listingId: number;
  score: number;
  behaviorScore: number;
  contentScore: number;
  popularityScore: number;
  explanations: string[];
};

const RECOMMENDER_URL = process.env.RECOMMENDER_URL || "http://localhost:5000";

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

async function getViewHistory(
  userId: number,
): Promise<RecommendationHistoryRow[]> {
  // Create a subquery to count bids per listing
  const bidsCountSubquery = db
    .select({
      listing_id: bids.listing_id,
      bid_count: count().as("bid_count"),
    })
    .from(bids)
    .groupBy(bids.listing_id)
    .as("bstats");

  const result = await db
    .select({
      listing_id: listingInteractions.listing_id,
      interaction_score: sql<number>`1.25`,
      type: listings.type,
      location: listings.location,
      price: listings.current_price,
      make: vehicles.make,
      model: vehicles.model,
      condition: vehicles.condition,
      year: vehicles.year,
      views_count: listings.views_count,
      bid_count: sql<number>`COALESCE(${bidsCountSubquery.bid_count}, 0)`,
    })
    .from(listingInteractions)
    .innerJoin(listings, eq(listings.id, listingInteractions.listing_id))
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
    .leftJoin(bidsCountSubquery, eq(bidsCountSubquery.listing_id, listings.id))
    .where(
      and(
        eq(listingInteractions.user_id, userId),
        eq(listingInteractions.interaction_type, "view"),
      ),
    )
    .orderBy(desc(listingInteractions.occurred_at))
    .limit(25);

  return result.map((row) => ({
    ...row,
    price: Number(row.price),
  })) as RecommendationHistoryRow[];
}

async function getBidHistory(
  userId: number,
): Promise<RecommendationHistoryRow[]> {
  // Create a subquery to get bid stats per listing
  const bidStatsSubquery = db
    .select({
      listing_id: bids.listing_id,
      bid_count: count().as("bid_count"),
      max_bid_time: sql<Date>`MAX(${bids.bid_time})`.as("max_bid_time"),
    })
    .from(bids)
    .where(eq(bids.bidder_id, userId))
    .groupBy(bids.listing_id)
    .as("bid_stats");

  const result = await db
    .select({
      listing_id: bidStatsSubquery.listing_id,
      interaction_score: sql<number>`2.5 + ${bidStatsSubquery.bid_count}::float8 * 0.5`,
      type: listings.type,
      location: listings.location,
      price: listings.current_price,
      make: vehicles.make,
      model: vehicles.model,
      condition: vehicles.condition,
      year: vehicles.year,
      views_count: listings.views_count,
      bid_count: bidStatsSubquery.bid_count,
    })
    .from(bidStatsSubquery)
    .innerJoin(listings, eq(listings.id, bidStatsSubquery.listing_id))
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
    .orderBy(desc(bidStatsSubquery.max_bid_time))
    .limit(25);

  return result.map((row) => ({
    ...row,
    price: Number(row.price),
  })) as RecommendationHistoryRow[];
}

async function getCandidateListings(userId: number): Promise<CandidateRow[]> {
  // Create a subquery to count bids per listing
  const bidsCountSubquery = db
    .select({
      listing_id: bids.listing_id,
      bid_count: count().as("bid_count"),
    })
    .from(bids)
    .groupBy(bids.listing_id)
    .as("bstats");

  const result = await db
    .select({
      listing_id: listings.id,
      type: listings.type,
      location: listings.location,
      price: listings.current_price,
      make: vehicles.make,
      model: vehicles.model,
      condition: vehicles.condition,
      year: vehicles.year,
      views_count: listings.views_count,
      bid_count: sql<number>`COALESCE(${bidsCountSubquery.bid_count}, 0)`,
      image_url: vehicles.image_url,
      start_time: listings.start_time,
      end_time: listings.end_time,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicle_id))
    .leftJoin(bidsCountSubquery, eq(bidsCountSubquery.listing_id, listings.id))
    .where(
      and(
        eq(listings.status, "active"),
        sql`${listings.seller_id} <> ${userId}`,
      ),
    )
    .orderBy(asc(listings.end_time));

  return result.map((row) => ({
    ...row,
    price: Number(row.price),
  })) as CandidateRow[];
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
    console.error(
      "[Recommendations] Service unavailable, falling back to popularity",
      error,
    );
    recommendations = candidates
      .sort(
        (a, b) => b.bid_count + b.views_count - (a.bid_count + a.views_count),
      )
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

  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.listing_id, candidate]),
  );

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
  const startTime =
    listing.start_time instanceof Date
      ? listing.start_time
      : new Date(listing.start_time);
  const endTime =
    listing.end_time instanceof Date
      ? listing.end_time
      : new Date(listing.end_time);

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
    startsAt: startTime.toISOString(),
    endsAt: endTime.toISOString(),
    bids: Number(listing.bid_count),
    recommendationScore: listing.score,
    behaviorScore: listing.behaviorScore,
    contentScore: listing.contentScore,
    popularityScore: listing.popularityScore,
    explanations: listing.explanations,
  };
}
