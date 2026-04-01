import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getHeatmapPoints } from "../services/heatmapService";

export const heatmapRouter = Router();

type Bounds = {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
};

/**
 * GET /api/heatmap?metric=views|bids|transactions&neLat=...&neLng=...&swLat=...&swLng=...
 * Returns: { metric, points: [{ lat, lng, weight }] }
 */
heatmapRouter.get("/", requireAuth, async (req, res) => {
  const startedAt = Date.now();

  try {
    const metric = (req.query.metric as string) || "views";
    
    // Parse bounds if provided
    let bounds: Bounds | null = null;
    const neLat = req.query.neLat ? parseFloat(req.query.neLat as string) : null;
    const neLng = req.query.neLng ? parseFloat(req.query.neLng as string) : null;
    const swLat = req.query.swLat ? parseFloat(req.query.swLat as string) : null;
    const swLng = req.query.swLng ? parseFloat(req.query.swLng as string) : null;

    if (
      neLat !== null &&
      neLng !== null &&
      swLat !== null &&
      swLng !== null &&
      Number.isFinite(neLat) &&
      Number.isFinite(neLng) &&
      Number.isFinite(swLat) &&
      Number.isFinite(swLng)
    ) {
      bounds = { neLat, neLng, swLat, swLng };
    }

    // console.log(`[HeatmapRoute] Fetching heatmap for metric: ${metric}`, {
    //   hasBounds: !!bounds,
    // });

    const points = await getHeatmapPoints(metric, bounds);
    const safePoints = Array.isArray(points) ? points : [];

    if (!Array.isArray(points)) {
      // console.error(
      //   `[HeatmapRoute] Invalid response from heatmap service:`,
      //   typeof points,
      // );
    }

    // console.log(
    //   `[HeatmapRoute] Returning ${safePoints.length} heatmap points in ${Date.now() - startedAt}ms`,
    // );

    res.json({ metric, points: safePoints });
  } catch (err) {
    console.error("[HeatmapRoute] Error:", err);
    res.status(500).json({ message: "Failed to generate heatmap data" });
  }
});
