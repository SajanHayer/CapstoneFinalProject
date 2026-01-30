import cron from "node-cron";
import { settleEndedAuctions } from "../services/auctionEnd";

export function startAuctionCron() {
  cron.schedule("30 * * * * *", async () => {
    try {
      console.log("Running auction settlement...");
      await settleEndedAuctions();
    } catch (err) {
      console.error("Auction cron error:", err);
    }
  });
}