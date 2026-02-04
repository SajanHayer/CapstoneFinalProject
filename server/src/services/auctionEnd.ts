import { db } from "../db/db";
import { listings, bids, transactions } from "../db/schema";
import { and, eq, lte, desc } from "drizzle-orm";

export async function settleEndedAuctions() {
  const now = new Date();

  // 1️⃣ Find ACTIVE listings that have ended
  const endedListings = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.status, "active"),
        lte(listings.end_time, now)
      )
    );

  for (const listing of endedListings) {
    // Get highest bid for this listing
    const highestBid = await db
      .select()
      .from(bids)
      .where(eq(bids.listing_id, listing.id))
      .orderBy(desc(bids.bid_amount))
      .limit(1);

    // NO BIDS
    if (highestBid.length === 0) {
      await db
        .update(listings)
        .set({
          status: "ended",
          end_reason: "nobids",
        })
        .where(eq(listings.id, listing.id));

      continue;
    }

    const bid = highestBid[0];
    // RESERVE MET --> SUCCESS
    if (bid.bid_amount >= listing.reserve_price) {
      await db.transaction(async (tx) => {
        await tx
          .update(listings)
          .set({
            status: "sold",
            end_reason: "success",
          })
          .where(eq(listings.id, listing.id));
      });
    } 
    // RESERVE NOT MET --> next steps 
    else {
      await db
        .update(listings)
        .set({
          status: "ended",
          end_reason: "unmet",
        })
        .where(eq(listings.id, listing.id));
    }
  }
}
