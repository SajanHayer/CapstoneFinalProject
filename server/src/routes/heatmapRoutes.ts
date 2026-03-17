import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getHeatmapPoints } from "../services/heatmapService";

export const heatmapRouter = Router();

/**
 * GET /api/heatmap?metric=views|bids|transactions
 * Returns: { metric, points: [{ lat, lng, weight }] }
 */
heatmapRouter.get("/", requireAuth, async (req, res) => {
  try {
    const metric = (req.query.metric as string) || "views";
    console.log(`[HeatmapRoute] Fetching heatmap for metric: ${metric}`);

    const points = await getHeatmapPoints(metric);
    
    console.log(`[HeatmapRoute] Returning ${points.length} heatmap points`);
    
    // Validate response structure
    if (!Array.isArray(points)) {
      console.error(`[HeatmapRoute] ERROR: getHeatmapPoints returned non-array:`, typeof points);
      return res.status(500).json({ message: "Invalid response from heatmap service" });
    }

    res.json({ metric, points });
  } catch (err) {
    console.error("[HeatmapRoute] Error:", err);
    res.status(500).json({ message: "Failed to generate heatmap data" });
  }
});

