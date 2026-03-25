import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getRecommendationsForUser,
  toRecommendationCard,
  trackListingView,
} from "../services/recommendationService";

export const recommendationRouter = Router();

recommendationRouter.get("/health", async (_req, res) => {
  const url = process.env.RECOMMENDER_URL || "http://localhost:5000";

  try {
    const response = await fetch(`${url}/health`);
    const payload = response.ok ? await response.json() : { status: "error" };
    res.status(response.ok ? 200 : 502).json(payload);
  } catch (error) {
    console.error("[Recommendations] Health check failed", error);
    res.status(502).json({ status: "unavailable" });
  }
});

recommendationRouter.get("/for-you", requireAuth, async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    const limit = Number(req.query.limit ?? 6);
    const recommendations = await getRecommendationsForUser(userId, limit);

    res.json({
      recommendations: recommendations.map(toRecommendationCard),
    });
  } catch (error) {
    console.error("[Recommendations] Fetch failed", error);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

recommendationRouter.post("/interactions/view", requireAuth, async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    const listingId = Number(req.body?.listingId);

    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ message: "Valid listingId is required" });
    }

    await trackListingView(userId, listingId);
    return res.status(204).send();
  } catch (error) {
    console.error("[Recommendations] View tracking failed", error);
    return res.status(500).json({ message: "Failed to track listing view" });
  }
});
