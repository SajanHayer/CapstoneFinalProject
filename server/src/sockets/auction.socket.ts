import { io } from "../index.ts";
import { placeBid } from "../services/bidding.ts";

export const registerAuctionSockets = () => {
  io.on("connection", (socket) => {
    console.log("🟢 Auction socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Auction socket disconnected:", socket.id);
    });

    // Join auction room
    socket.on("join_auction", (auctionId: number) => {
      socket.join(`auction:${auctionId}`);
      console.log(`Socket ${socket.id} joined auction ${auctionId}`);
    });

    // Leave auction room
    socket.on("leave_auction", (auctionId: number) => {
      socket.leave(`auction:${auctionId}`);
      console.log(`Socket ${socket.id} left auction ${auctionId}`);
    });

    // Place bid (DB logic later)
    socket.on("place_bid", async ({ auctionId, amount, userId, location }) => {
      console.log("Bid received:", auctionId, amount, userId, location);
      try {
        const updatedListing = await placeBid({
          listingId: auctionId,
          bidAmount: amount,
          bidderId: userId,
          location: location,
        });

        // Broadcast bid update to all users in this auction room
        io.to(`auction:${auctionId}`).emit("bid_update", {
          auctionId,
          amount,
          bidder_id: userId,
          end_time: updatedListing.end_time,
          extended: updatedListing.extended || false,
        });

        // Emit to bid history as well
        io.to(`auction:${auctionId}`).emit(`listing_${auctionId}_bid`, {
          id: Date.now(), // temporary id
          bidder_id: userId,
          bid_amount: amount,
          bid_time: new Date(),
          location: location || "N/A",
        });
      } catch (err: any) {
        socket.emit("bid_error", {
          message: err.message,
        });
      }
    });
  });
};
