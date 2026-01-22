import { io } from "../index.ts";

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
    socket.on("place_bid", async ({ auctionId, amount }) => {
      console.log("📨 Bid received:", auctionId, amount);

      // placeholder response
      io.to(`auction:${auctionId}`).emit("bid_update", {
        auctionId,
        amount,
      });
    });
  });
};
