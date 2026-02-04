// src/services/bidding.ts
import { db } from "../db/db";
import { listings, bids } from "../db/schema";
import { eq } from "drizzle-orm";

export async function placeBid({
  listingId,
  bidAmount,
  bidderId,
}: {
  listingId: number;
  bidAmount: string;
  bidderId: number;
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

    await tx.insert(bids).values({
      listing_id: listingId,
      bidder_id: bidderId,
      bid_amount: bidAmount,
    });

    const [updatedListing] = await tx
      .update(listings)
      .set({ current_price: bidAmount })
      .where(eq(listings.id, listingId))
      .returning();

    return updatedListing;
  });
}
