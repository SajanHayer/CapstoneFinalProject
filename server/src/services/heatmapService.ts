import { db } from "../db/db";
import { listings } from "../db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

type Metric = "views" | "bids" | "transactions";

type Bounds = {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
};

type HeatmapPoint = {
  lat: number;
  lng: number;
  weight: number;
  location: string;
  imageUrl: string | null;
  listingId: string;
};

const GEOCODING_TIMEOUT_MS = 8000;

function assertMetric(m: string): Metric {
  if (m === "views" || m === "bids" || m === "transactions") return m;
  return "views";
}

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!key) {
    // If you only use Maps on the frontend, you can skip geocoding entirely.
    // But with your current schema (location string), server-side geocoding is required.
    console.warn(
      "[Heatmap] Missing GOOGLE_GEOCODING_API_KEY - geocoding disabled",
    );
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEOCODING_TIMEOUT_MS);

  try {
    const url =
      "https://maps.googleapis.com/maps/api/geocode/json?" +
      new URLSearchParams({ address, key }).toString();

    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`[Heatmap] Geocoding request failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) {
      console.debug(
        `[Heatmap] No geocoding results for: "${address}" (status: ${data.status})`,
      );
      return null;
    }

    const loc = data.results[0].geometry.location;
    const coords = { lat: Number(loc.lat), lng: Number(loc.lng) };
    console.debug(
      `[Heatmap] Geocoded "${address}" → ${JSON.stringify(coords)}`,
    );
    return coords;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`[Heatmap] Geocoding timed out for "${address}"`);
      return null;
    }

    console.error(`[Heatmap] Geocoding error for "${address}":`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Ensure listings with a location have cached lat/lng.
 * Runs a small batch to avoid burning API quota.
 */
async function backfillListingLatLng(batchSize = 25): Promise<void> {
  // Find listings that have a location but no lat/lng
  const missing = await db
    .select({
      id: listings.id,
      location: listings.location,
    })
    .from(listings)
    .where(
      and(
        isNotNull(listings.location),
        sql`${listings.latitude} is null or ${listings.longitude} is null`,
      ),
    )
    .limit(batchSize);

  for (const row of missing) {
    const loc = row.location?.trim();
    if (!loc) continue;

    // You can improve accuracy by appending "Canada" or province if your data is local:
    // const query = `${loc}, Canada`;
    const query = loc;

    const coords = await geocodeAddress(query);
    if (!coords) continue;

    await db
      .update(listings)
      .set({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
      })
      .where(eq(listings.id, row.id));
  }
}

export async function getHeatmapPoints(
  metricRaw: string,
  bounds?: Bounds | null,
): Promise<HeatmapPoint[]> {
  const metric = assertMetric(metricRaw);

  // 1) Backfill some missing coordinates (safe + incremental)
  // If you prefer a separate admin job, you can remove this and run it via cron instead.
  try {
    await backfillListingLatLng(25);
  } catch (error) {
    console.error(
      "[Heatmap] Backfill failed; continuing with cached coordinates only",
      error,
    );
  }

  // 2) Aggregate weights
  // We compute points at listing-level:
  // - views: listings.views_count
  // - bids: count(bids.id)
  // - transactions: count(transactions.id)
  let rows: any[] = [];

  if (metric === "views") {
    rows = await db.execute(sql`
      SELECT
        l.id AS listing_id,
        l.latitude AS lat,
        l.longitude AS lng,
        l.location AS location,
        v.image_url AS image_url,
        GREATEST(COALESCE(l.views_count, 0), 1) AS weight
      FROM listings l
      JOIN vehicles v ON v.id = l.vehicle_id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND l.status = 'active'
    `);
  }

  if (metric === "bids") {
    rows = await db.execute(sql`
      SELECT
        l.id AS listing_id,
        l.latitude AS lat,
        l.longitude AS lng,
        l.location AS location,
        v.image_url AS image_url,
        COUNT(b.id)::int AS weight
      FROM listings l
      JOIN vehicles v ON v.id = l.vehicle_id
      JOIN bids b ON b.listing_id = l.id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND l.status = 'active'
      GROUP BY l.id, l.latitude, l.longitude, l.location, v.image_url
    `);
  }

  if (metric === "transactions") {
    rows = await db.execute(sql`
      SELECT
        l.id AS listing_id,
        l.latitude AS lat,
        l.longitude AS lng,
        l.location AS location,
        v.image_url AS image_url,
        COUNT(t.id)::int AS weight
      FROM listings l
      JOIN vehicles v ON v.id = l.vehicle_id
      JOIN transactions t ON t.listing_id = l.id
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND l.status IN ('active', 'ended', 'sold')
      GROUP BY l.id, l.latitude, l.longitude, l.location, v.image_url
    `);
  }

  // drizzle db.execute returns { rows } in some setups; normalize:
  const resultRows = (rows as any).rows ?? rows;

  // 3) Shape + filter + ensure proper numeric conversion
  const points = (resultRows as any[])
    .map((r) => {
      // Handle cases where PostgreSQL numeric type returns string
      const lat = typeof r.lat === "string" ? parseFloat(r.lat) : Number(r.lat);
      const lng = typeof r.lng === "string" ? parseFloat(r.lng) : Number(r.lng);
      const weight = Number(r.weight);
      const imageCandidates = Array.isArray(r.image_url)
        ? r.image_url
        : typeof r.image_url === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(r.image_url);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })()
          : [];
      const firstImage =
        imageCandidates.find(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        ) ?? null;

      return {
        lat,
        lng,
        weight,
        location:
          typeof r.location === "string" && r.location.trim().length > 0
            ? r.location.trim()
            : "Unknown location",
        imageUrl: firstImage,
        listingId:
          typeof r.listing_id === "string"
            ? r.listing_id
            : String(r.listing_id || ""),
      };
    })
    .filter((p) => {
      const isValid =
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        Number.isFinite(p.weight) &&
        p.weight > 0 &&
        p.listingId.length > 0;
      if (!isValid) {
        console.warn(`[Heatmap] Filtered invalid point:`, p);
      }
      return isValid;
    });

  // console.log(
  //   `[Heatmap] Generated ${points.length} valid points for metric: ${metric}`,
  // );

  // Filter by bounds if provided
  if (bounds) {
    const filteredPoints = points.filter((p) => {
      // Check if point is within bounds
      // NE = northeast (top-right), SW = southwest (bottom-left)
      const isWithinLatitude =
        p.lat >= Math.min(bounds.swLat, bounds.neLat) &&
        p.lat <= Math.max(bounds.swLat, bounds.neLat);

      const isWithinLongitude =
        p.lng >= Math.min(bounds.swLng, bounds.neLng) &&
        p.lng <= Math.max(bounds.swLng, bounds.neLng);

      return isWithinLatitude && isWithinLongitude;
    });

    // console.log(
    //   `[Heatmap] Filtered to ${filteredPoints.length} points within bounds`,
    //   bounds,
    // );
    return filteredPoints;
  }

  return points;
}
