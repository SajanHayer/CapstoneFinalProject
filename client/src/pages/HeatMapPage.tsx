import React, { useMemo, useState } from "react";
import { LoadScript, GoogleMap, HeatmapLayer } from "@react-google-maps/api";

type Metric = "views" | "bids" | "transactions";

type HeatPoint = { lat: number; lng: number; weight: number };

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "70vh",
  borderRadius: 12,
};

export const HeatMapPage: React.FC = () => {
  const [metric, setMetric] = useState<Metric>("views");
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Calgary-ish default; adjust if your sponsor data is elsewhere
  const center = useMemo(() => ({ lat: 51.0447, lng: -114.0719 }), []);

  async function loadPoints(nextMetric: Metric) {
    setLoading(true);
    setError(null);
    setDebugInfo("");
    try {
      const url = `${API_BASE}/api/heatmap?metric=${nextMetric}`;
      console.log(`[HeatMap] Fetching from: ${url}`);

      const res = await fetch(url, {
        method: "GET",
        credentials: "include", // your backend uses cookies
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log(`[HeatMap] API Response:`, data);

      const receivedPoints = data.points || [];
      
      // Validate points structure
      const validPoints = receivedPoints.filter((p: any) => {
        const isValid = typeof p.lat === 'number' && typeof p.lng === 'number' && typeof p.weight === 'number';
        if (!isValid) {
          console.warn(`[HeatMap] Invalid point structure:`, p);
        }
        return isValid;
      });

      setPoints(validPoints);
      setDebugInfo(`Received ${receivedPoints.length} points, ${validPoints.length} valid`);
      console.log(`[HeatMap] Loaded ${validPoints.length} valid heatmap points`, validPoints);

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`[HeatMap] Error:`, errorMsg);
      setError(errorMsg);
      setPoints([]);
      setDebugInfo(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadPoints(metric);
  }, [metric]);

  const heatmapData = useMemo(() => {
    // HeatmapLayer expects google.maps.LatLng or WeightedLocation objects
    // @react-google-maps/api supports objects like { location: LatLng, weight }
    if (points.length === 0) return [];

    return points.map((p) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) {
        console.warn(`[HeatMap] Skipping invalid point in transform:`, p);
        return null;
      }
      return {
        location: new google.maps.LatLng(p.lat, p.lng),
        weight: Math.max(1, Math.min(100, p.weight)), // Clamp weight to 1-100 for visibility
      };
    }).filter((item) => item !== null) as Array<{ location: google.maps.LatLng; weight: number }>;
  }, [points]);

  if (!MAPS_KEY) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Heat Map</h2>
        <p style={{ color: 'red' }}>Missing VITE_GOOGLE_MAPS_API_KEY in client/.env</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Market Heat Map</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Visualize hotspots by {metric} (from your listings activity).
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <label>
          Metric:&nbsp;
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            style={{ padding: 8, borderRadius: 8 }}
          >
            <option value="views">Views</option>
            <option value="bids">Bids</option>
            <option value="transactions">Transactions</option>
          </select>
        </label>

        {loading && <span style={{ color: '#ff9800' }}>⏳ Loading…</span>}
        {!loading && error && <span style={{ color: 'red' }}>❌ {error}</span>}
        {!loading && !error && (
          <span style={{ opacity: 0.8 }}>
            ✓ {points.length} points ({heatmapData.length} rendered)
          </span>
        )}
      </div>

      {debugInfo && (
        <div style={{ 
          padding: 8, 
          marginBottom: 12, 
          backgroundColor: '#f5f5f5', 
          borderRadius: 8,
          fontSize: '0.9em',
          fontFamily: 'monospace'
        }}>
          {debugInfo}
        </div>
      )}

      <LoadScript googleMapsApiKey={MAPS_KEY} libraries={["visualization"]}>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
          {heatmapData.length > 0 ? (
            <HeatmapLayer data={heatmapData} />
          ) : (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: 16,
              borderRadius: 8,
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              No heatmap data available
            </div>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
