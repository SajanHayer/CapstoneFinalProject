import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  GoogleMap,
  HeatmapLayer,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";

type Metric = "views" | "bids" | "transactions";

type HeatPoint = {
  lat: number;
  lng: number;
  weight: number;
  location: string;
  imageUrl: string | null;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const HEATMAP_REQUEST_TIMEOUT_MS = 15000;
const GOOGLE_MAP_LIBRARIES: ("visualization")[] = ["visualization"];

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "70vh",
  borderRadius: 12,
};

const MapContent: React.FC<{
  metric: Metric;
  onMetricChange: (metric: Metric) => void;
  points: HeatPoint[];
  loading: boolean;
  error: string | null;
  debugInfo: string;
  center: { lat: number; lng: number };
  onRetry: () => void;
}> = ({ metric, onMetricChange, points, loading, error, debugInfo, center, onRetry }) => {
  const [hoveredPoint, setHoveredPoint] = useState<HeatPoint | null>(null);

  const heatmapData = useMemo(() => {
    if (points.length === 0 || typeof google === "undefined" || !google.maps?.LatLng) {
      return [];
    }

    return points
      .map((point) => {
        if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
          console.warn("[HeatMap] Skipping invalid point:", point);
          return null;
        }

        return {
          location: new google.maps.LatLng(point.lat, point.lng),
          weight: Math.max(1, Math.min(100, point.weight)),
        };
      })
      .filter((item): item is { location: google.maps.LatLng; weight: number } => item !== null);
  }, [points]);

  useEffect(() => {
    setHoveredPoint(null);
  }, [metric, points]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Market Heat Map</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Visualize hotspots by {metric} (from your listings activity).
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <label>
          Metric:&nbsp;
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value as Metric)}
            style={{ padding: 8, borderRadius: 8 }}
            disabled={loading}
          >
            <option value="views">Views</option>
            <option value="bids">Bids</option>
            <option value="transactions">Transactions</option>
          </select>
        </label>

        {loading && <span style={{ color: "#ff9800" }}>Loading...</span>}
        {!loading && error && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "red" }}>{error}</span>
            <button
              onClick={onRetry}
              style={{
                padding: "4px 12px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.9em",
              }}
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && (
          <span style={{ opacity: 0.8 }}>
            {points.length} points ({heatmapData.length} rendered)
          </span>
        )}
      </div>

      {debugInfo && (
        <div
          style={{
            padding: 8,
            marginBottom: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
            fontSize: "0.9em",
            fontFamily: "monospace",
          }}
        >
          {debugInfo}
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
        }}
      >
        {heatmapData.length > 0 && <HeatmapLayer key={`${metric}-${heatmapData.length}`} data={heatmapData} />}
        {points.map((point) => (
          <Circle
            key={`${metric}-${point.lat}-${point.lng}-${point.location}`}
            center={{ lat: point.lat, lng: point.lng }}
            radius={3500}
            options={{
              fillOpacity: 0,
              strokeOpacity: 0,
              clickable: true,
              zIndex: 20,
            }}
            onMouseOver={() => setHoveredPoint(point)}
            onMouseOut={() =>
              setHoveredPoint((current) =>
                current &&
              current.lat === point.lat &&
                current.lng === point.lng &&
                current.location === point.location
                  ? null
                  : current,
              )
            }
          />
        ))}
        {hoveredPoint && (
          <InfoWindow
            position={{ lat: hoveredPoint.lat, lng: hoveredPoint.lng }}
            onCloseClick={() => setHoveredPoint(null)}
          >
            <div style={{ minWidth: 220, maxWidth: 260 }}>
              {hoveredPoint.imageUrl && (
                <img
                  src={hoveredPoint.imageUrl}
                  alt={hoveredPoint.location}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 10,
                    display: "block",
                  }}
                />
              )}
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {hoveredPoint.location}
              </div>
              <div style={{ fontSize: "0.9em", opacity: 0.85 }}>
                Address: {hoveredPoint.location}
              </div>
              <div style={{ fontSize: "0.9em", opacity: 0.85, marginTop: 4 }}>
                {metric.charAt(0).toUpperCase() + metric.slice(1)} intensity:{" "}
                {hoveredPoint.weight}
              </div>
            </div>
          </InfoWindow>
        )}
        {heatmapData.length === 0 && !loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              padding: 16,
              borderRadius: 8,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            No heatmap data available
          </div>
        )}
      </GoogleMap>
    </div>
  );
};

export const HeatMapPage: React.FC = () => {
  const [metric, setMetric] = useState<Metric>("views");
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const requestIdRef = useRef(0);
  const { isLoaded: isMapsLoaded, loadError } = useJsApiLoader({
    id: "heatmap-google-maps-script",
    googleMapsApiKey: MAPS_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const center = useMemo(() => ({ lat: 51.0447, lng: -114.0719 }), []);

  useEffect(() => {
    console.log("[HeatMap] Component mounted");

    return () => {
      console.log("[HeatMap] Component unmounted");
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    let isActive = true;
    let didTimeout = false;

    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, HEATMAP_REQUEST_TIMEOUT_MS);

    const fetchHeatmap = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo(`Loading ${metric} heatmap...`);

      const url = `${API_BASE}/api/heatmap?metric=${metric}`;
      console.log(`[HeatMap] [request ${requestId}] Fetch start`, { metric, url, retryNonce });

      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap (${response.status} ${response.statusText})`);
        }

        const payload = await response.json();
        const rawPoints = Array.isArray(payload?.points) ? payload.points : [];
        const validPoints = rawPoints
          .map((point: Partial<HeatPoint>) => ({
            lat: Number(point.lat),
            lng: Number(point.lng),
            weight: Number(point.weight),
            location:
              typeof point.location === "string" && point.location.trim().length > 0
                ? point.location.trim()
                : "Unknown location",
            imageUrl:
              typeof point.imageUrl === "string" && point.imageUrl.trim().length > 0
                ? point.imageUrl
                : null,
          }))
          .filter((point: HeatPoint) => {
            const isValid =
              Number.isFinite(point.lat) &&
              Number.isFinite(point.lng) &&
              Number.isFinite(point.weight) &&
              point.weight > 0;

            if (!isValid) {
              console.warn("[HeatMap] Invalid point filtered out:", point);
            }

            return isValid;
          });

        if (!isActive || requestId !== requestIdRef.current) {
          console.log(`[HeatMap] [request ${requestId}] Ignoring stale success`);
          return;
        }

        console.log(`[HeatMap] [request ${requestId}] Fetch success`, {
          received: rawPoints.length,
          valid: validPoints.length,
        });

        setPoints(validPoints);
        setDebugInfo(`Received ${rawPoints.length} points, ${validPoints.length} valid`);
      } catch (caughtError) {
        if (!isActive || requestId !== requestIdRef.current) {
          console.log(`[HeatMap] [request ${requestId}] Ignoring stale failure`);
          return;
        }

        if (controller.signal.aborted && !didTimeout) {
          console.log(`[HeatMap] [request ${requestId}] Fetch aborted`);
          return;
        }

        const message =
          didTimeout
            ? "Heatmap request timed out. Please try again."
            : caughtError instanceof Error
              ? caughtError.message
              : "Failed to load heatmap";

        console.error(`[HeatMap] [request ${requestId}] Fetch failed`, caughtError);
        setPoints([]);
        setError(message);
        setDebugInfo(`Error: ${message}`);
      } finally {
        window.clearTimeout(timeoutId);

        if (isActive && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void fetchHeatmap();

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      console.log(`[HeatMap] [request ${requestId}] Cleanup`);
      controller.abort();
    };
  }, [metric, retryNonce]);

  if (!MAPS_KEY) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Heat Map</h2>
        <p style={{ color: "red" }}>
          Missing VITE_GOOGLE_MAPS_API_KEY in client/.env
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Heat Map</h2>
        <p style={{ color: "red" }}>Google Maps failed to load.</p>
      </div>
    );
  }

  if (!isMapsLoaded) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Heat Map</h2>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <MapContent
      metric={metric}
      onMetricChange={setMetric}
      points={points}
      loading={loading}
      error={error}
      debugInfo={debugInfo}
      center={center}
      onRetry={() => setRetryNonce((current) => current + 1)}
    />
  );
};
