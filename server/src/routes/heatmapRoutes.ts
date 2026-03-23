import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getHeatmapPoints } from "../services/heatmapService";

export const heatmapRouter = Router();

/**
 * GET /api/heatmap?metric=views|bids|transactions
 * Returns: { metric, points: [{ lat, lng, weight }] }
 */
heatmapRouter.get("/", requireAuth, async (req, res) => {
  const startedAt = Date.now();

  try {
    const metric = (req.query.metric as string) || "views";
    console.log(`[HeatmapRoute] Fetching heatmap for metric: ${metric}`);

    const points = await getHeatmapPoints(metric);
    const safePoints = Array.isArray(points) ? points : [];

    if (!Array.isArray(points)) {
      console.error(`[HeatmapRoute] Invalid response from heatmap service:`, typeof points);
    }

    console.log(
      `[HeatmapRoute] Returning ${safePoints.length} heatmap points in ${Date.now() - startedAt}ms`
    );

    res.json({ metric, points: safePoints });
  } catch (err) {
    console.error("[HeatmapRoute] Error:", err);
    res.status(500).json({ message: "Failed to generate heatmap data" });
  }
});

