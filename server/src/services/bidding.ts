// src/services/bidding.ts
import { db } from "../db/db";
import { listings, bids } from "../db/schema";
import { eq } from "drizzle-orm";

export async function placeBid({
  listingId,
  bidAmount,
  bidderId,
  location,
}: {
  listingId: number;
  bidAmount: string;
  bidderId: number;
  location?: string;
}) {
  return db.transaction(async (tx) => {
    const [listing] = await tx
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .for("update");

    if (!listing) throw new Error("Listing not found");
    if (listing.status !== "active") throw new Error("Auction not active");

    if (Number(bidAmount) <= Number(listing.current_price)) {
      throw new Error("Bid too low");
    }

    // Check if bid is placed within 30 seconds of auction end
    const now = new Date();
    const endTime = new Date(listing.end_time);
    const timeRemaining = endTime.getTime() - now.getTime();
    const thirtySecondsMs = 30 * 1000;

    let newEndTime = listing.end_time;
    if (timeRemaining > 0 && timeRemaining < thirtySecondsMs) {
      // Extend end time by 30 seconds
      newEndTime = new Date(endTime.getTime() + thirtySecondsMs);
    }

    await tx.insert(bids).values({
      listing_id: listingId,
      bidder_id: bidderId,
      bid_amount: bidAmount,
      location: location || null,
    });

    const [updatedListing] = await tx
      .update(listings)
      .set({
        current_price: bidAmount,
        end_time: newEndTime,
      })
      .where(eq(listings.id, listingId))
      .returning();

    return {
      ...updatedListing,
      extended: newEndTime !== listing.end_time,
    };
  });
}
