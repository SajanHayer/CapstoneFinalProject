import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { GoogleMap, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { GoogleMapsOverlay as DeckGLOverlay } from "@deck.gl/google-maps";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";

type Metric = "views" | "bids" | "transactions";

type HeatPoint = {
  lat: number;
  lng: number;
  weight: number;
  location: string;
  imageUrl: string | null;
  listingId: string;
};

type City = {
  name: string;
  lat: number;
  lng: number;
};

const CITIES: City[] = [
  { name: "Calgary", lat: 51.0447, lng: -114.0719 },
  { name: "Edmonton", lat: 53.5461, lng: -113.4938 },
  { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Montreal", lat: 45.5017, lng: -73.5673 },
];

const SEARCH_RADIUS_OPTIONS = [25, 50, 75, 100];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const HEATMAP_REQUEST_TIMEOUT_MS = 15000;
const GOOGLE_MAP_LIBRARIES = ["visualization"];

const containerStyle: React.CSSProperties = {
  width: "450px",
  height: "600px",
  borderRadius: 12,
  cursor: "default",
};

type Bounds = {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
};

const MapContent: React.FC<{
  metric: Metric;
  points: HeatPoint[];
  loading: boolean;
  error: string | null;
  center: { lat: number; lng: number };
  onRetry: () => void;
  onMapZoomChanged: () => void;
  isZoomingRef: React.MutableRefObject<boolean>;
  shouldFetchNewData: (bounds: Bounds, zoom: number) => boolean;
  setBounds: (bounds: Bounds) => void;
  setRetryNonce: (fn: (current: number) => number) => void;
  previousBoundsRef: React.MutableRefObject<Bounds | null>;
  previousZoomRef: React.MutableRefObject<number>;
  boundsTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  navigate: ReturnType<typeof useNavigate>;
  selectedCity: City;
  searchRadius: number;
  onCityChange: (city: City) => void;
  onSearchRadiusChange: (radius: number) => void;
  totalListings: number;
  listingsInRadius: number;
  currentZoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
}> = ({
  metric,
  points,
  loading,
  error,
  center,
  onRetry,
  onMapZoomChanged,
  isZoomingRef,
  shouldFetchNewData,
  setBounds,
  setRetryNonce,
  previousBoundsRef,
  previousZoomRef,
  boundsTimeoutRef,
  navigate,
  selectedCity,
  searchRadius,
  onCityChange,
  onSearchRadiusChange,
  totalListings,
  listingsInRadius,
  currentZoomLevel,
  onZoomLevelChange,
}) => {
  // === FIX 1: State for hovered item (not ref) - triggers UI update ===
  const [hoveredPoint, setHoveredPoint] = useState<HeatPoint | null>(null);
  // === FIX 7: Make popup independent - separate selected state ===
  const [selectedPoint, setSelectedPoint] = useState<HeatPoint | null>(null);
  // === FIX 5: Track zoom to conditionally show points ===
  const [currentZoom, setCurrentZoom] = useState<number>(10);

  const mapRef = useRef<google.maps.Map | null>(null);
  const deckglOverlayRef = useRef<DeckGLOverlay | null>(null);
  const currentZoomRef = useRef<number>(10);

  // === FIX 2: Hover stickiness - debounce clearing with ref ===
  const clearHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Helper to clear hover with delay
  const clearHoverWithDelay = (delayMs: number = 150) => {
    if (clearHoverTimeoutRef.current) {
      clearTimeout(clearHoverTimeoutRef.current);
    }
    clearHoverTimeoutRef.current = setTimeout(() => {
      setHoveredPoint(null);
    }, delayMs);
  };

  // Helper to cancel pending clear
  const cancelClearHover = () => {
    if (clearHoverTimeoutRef.current) {
      clearTimeout(clearHoverTimeoutRef.current);
      clearHoverTimeoutRef.current = null;
    }
  };

  // Handle map idle - only fetch when map settles
  const handleMapIdle = () => {
    isZoomingRef.current = false;

    if (boundsTimeoutRef.current) {
      clearTimeout(boundsTimeoutRef.current);
    }

    boundsTimeoutRef.current = setTimeout(() => {
      if (!mapRef.current) return;

      const map = mapRef.current;
      const bounds = map.getBounds();
      const zoom = map.getZoom() || 10;

      // === FIX 5: Update zoom state for layer visibility ===
      currentZoomRef.current = zoom;
      setCurrentZoom(zoom);
      onZoomLevelChange(zoom);

      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const newBounds: Bounds = {
          neLat: ne.lat(),
          neLng: ne.lng(),
          swLat: sw.lat(),
          swLng: sw.lng(),
        };

        // Only update if bounds changed significantly
        if (shouldFetchNewData(newBounds, zoom)) {
          previousBoundsRef.current = newBounds;
          previousZoomRef.current = zoom;
          setBounds(newBounds);
          setRetryNonce((current) => current + 1);
        }
      }
    }, 600);
  };

  // Transform heatmap data for deck.gl HeatmapLayer
  const heatmapLayerData = useMemo(() => {
    return points
      .map((point) => {
        if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
          console.warn("[HeatMap] Skipping invalid point:", point);
          return null;
        }
        return [point.lng, point.lat, Math.max(1, Math.min(100, point.weight))];
      })
      .filter((item) => item !== null);
  }, [points]);

  // Scatterplot layer for markers with clustering
  const scatterplotLayerData = useMemo(() => {
    return points.map((point) => ({
      position: [point.lng, point.lat],
      ...point,
    }));
  }, [points]);

  // Create deck.gl layers - only recreate when data changes, not on hover
  // === FIX 5: Show points only when zoomed in (reduce visual clutter) ===
  const layers = useMemo(() => {
    return [
      // Heatmap layer with performance optimizations
      heatmapLayerData.length > 0 &&
        new HeatmapLayer({
          id: "heatmap-layer",
          data: heatmapLayerData,
          getPosition: (d: any) => [d[0], d[1]],
          getWeight: (d: any) => d[2],
          radiusPixels: 25,
          intensity: 0.3,
          threshold: 0.1,
          colorRange: [
            [255, 255, 178],
            [254, 204, 92],
            [253, 141, 60],
            [227, 26, 28],
            [189, 0, 38],
          ],
          // Optimizations for smooth zoom/pan
          fp64: false,
          // Only update when data length actually changes, ignore zoom changes
          updateTriggers: {
            getPosition: [heatmapLayerData.length],
            getWeight: [heatmapLayerData.length],
          },
        }),
      // === FIX 5: Only show scatterplot when sufficiently zoomed (zoom >= 13) ===
      currentZoomRef.current >= 13 &&
        scatterplotLayerData.length > 0 &&
        new ScatterplotLayer({
          id: "scatterplot-layer",
          data: scatterplotLayerData,
          getPosition: (d: any) => d.position,
          // === FIX 3: Increase interaction area even more ===
          // Increased from 12 to 16 pixels for better visibility
          getRadius: () => 16,
          getColor: () => [255, 128, 0],
          pickable: true,
          autoHighlight: true,
          highlightColor: [0, 150, 255],
          // Further increased highlight size for better visual feedback
          highlightSize: 4,
          lineWidthUnits: "pixels",
          stroked: true,
          getLineColor: () => [255, 255, 255],
          getLineWidth: () => 2,
          // Performance optimizations
          fp64: false,
          // === FIX 3: Make picking even more forgiving ===
          // Increased from 15 to 25 pixels for easier targeting
          pickingRadius: 25,
          // === FIX 2 & 1: Hover with stickiness - update state ===
          onHover: (info: any) => {
            if (info.object) {
              // Only update if target actually changed (avoid spam)
              if (hoveredPoint?.listingId !== info.object.listingId) {
                setHoveredPoint(info.object);
                cancelClearHover();
              }
            } else {
              // Hover lost - apply delay before clearing
              clearHoverWithDelay(150);
            }
          },
          // === FIX 4: Don't rely on hover alone - add click to lock popup ===
          onClick: (info: any) => {
            if (info.object?.listingId) {
              setSelectedPoint(info.object);
            }
          },
          updateTriggers: {
            getPosition: [scatterplotLayerData.length],
            getRadius: [],
          },
        }),
    ].filter(Boolean);
  }, [heatmapLayerData, scatterplotLayerData, navigate, currentZoom]);

  // Initialize deck.gl overlay when map loads and update layers efficiently
  useEffect(() => {
    if (mapRef.current && !deckglOverlayRef.current) {
      deckglOverlayRef.current = new DeckGLOverlay({
        layers,
        // === POINTER EVENT HANDLING ===
        // interleaved=true: Canvas positioned to receive hover/click events properly
        // without blocking map interactions underneath
        interleaved: true,
      });
      deckglOverlayRef.current.setMap(mapRef.current);
    } else if (deckglOverlayRef.current && !isZoomingRef.current) {
      // Only update layers when NOT actively zooming
      deckglOverlayRef.current.setProps({ layers });
    }
  }, [layers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (deckglOverlayRef.current) {
        deckglOverlayRef.current.setMap(null);
        deckglOverlayRef.current = null;
      }
      if (clearHoverTimeoutRef.current) {
        clearTimeout(clearHoverTimeoutRef.current);
      }
    };
  }, []);

  // === FIX 1: Clear hover state when data changes ===
  useEffect(() => {
    setHoveredPoint(null);
    // Keep selectedPoint - it's independent
  }, [metric, points]);

  // === City Search State ===
  const [citySearchInput, setCitySearchInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const filteredCities = useMemo(() => {
    return CITIES.filter((city) =>
      city.name.toLowerCase().includes(citySearchInput.toLowerCase())
    );
  }, [citySearchInput]);

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Market Activity Heatmap</h2>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          View active listing intensity and market demand across your area
        </p>
      </div>

      {/* Main container with sidebar + map */}
      <div
        style={{
          display: "flex",
          gap: 12,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: 320,
            backgroundColor: "#f5f5f5",
            borderRadius: 12,
            padding: 20,
            height: "fit-content",
          }}
        >
          {/* City Filter */}
          <div style={{ marginBottom: 24, position: "relative" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 8,
                fontSize: "0.95em",
              }}
            >
              City
            </label>
            <input
              type="text"
              placeholder="Search cities..."
              value={citySearchInput}
              onChange={(e) => setCitySearchInput(e.target.value)}
              onFocus={() => setShowCityDropdown(true)}
              onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "0.95em",
                border: "1px solid #ddd",
                borderRadius: 6,
                backgroundColor: "white",
                boxSizing: "border-box",
              }}
            />
{showCityDropdown && filteredCities.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  maxHeight: 200,
                  overflowY: "auto",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {filteredCities.map((city) => (
                  <div
                    key={city.name}
                    onClick={() => {
                      onCityChange(city);
                      setCitySearchInput("");
                      setShowCityDropdown(false);
                    }}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedCity.name === city.name ? "#e8f0fe" : "white",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: "0.95em",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        selectedCity.name === city.name ? "#e8f0fe" : "white";
                    }}
                  >
                    {city.name}
                  </div>
                ))}
              </div>
            )}
            {showCityDropdown && filteredCities.length === 0 && citySearchInput && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  padding: "10px 12px",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  color: "#999",
                  fontSize: "0.9em",
                }}
              >
                No cities found
              </div>
            )}
          </div>

          {/* Search Radius Filter */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 8,
                fontSize: "0.95em",
              }}
            >
              Search Radius
            </label>
            <select
              value={searchRadius}
              onChange={(e) => onSearchRadiusChange(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "0.95em",
                border: "1px solid #ddd",
                borderRadius: 6,
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              {SEARCH_RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </select>
          </div>

          {/* Current Location Info */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #ddd" }}>
            <h3 style={{ fontSize: "0.95em", marginBottom: 12, fontWeight: 600 }}>
              Current Location
            </h3>
            <div style={{ fontSize: "0.85em" }}>
              <p style={{ margin: "6px 0", fontWeight: 500 }}>
                Selected City: <strong>{selectedCity.name}</strong>
              </p>
              {/* <p style={{ margin: "6px 0", fontSize: "0.8em", opacity: 0.7 }}>
                City Coordinates:
                <br />
                {selectedCity.lat.toFixed(4)}°, {selectedCity.lng.toFixed(4)}°
              </p> */}
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #ddd" }}>
            <p style={{ margin: "8px 0", fontSize: "0.95em" }}>
              <strong>Total Listings:</strong> {totalListings}
            </p>
            <p style={{ margin: "8px 0", fontSize: "0.95em" }}>
              <strong>Within Radius:</strong> {listingsInRadius}
            </p>
            <p style={{ margin: "8px 0", fontSize: "0.95em" }}>
              <strong>Zoom Level:</strong> {currentZoomLevel}
            </p>
          </div>

          {/* Activity Intensity Legend */}
          <div>
            <h3 style={{ fontSize: "0.95em", marginBottom: 12, fontWeight: 600 }}>
              Activity Intensity
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "#bd002e",
                    borderRadius: 3,
                  }}
                />
                <span style={{ fontSize: "0.85em" }}>Very High</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "#e31a1a",
                    borderRadius: 3,
                  }}
                />
                <span style={{ fontSize: "0.85em" }}>High</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "#fd8d3c",
                    borderRadius: 3,
                  }}
                />
                <span style={{ fontSize: "0.85em" }}>Medium</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "#fecc5c",
                    borderRadius: 3,
                  }}
                />
                <span style={{ fontSize: "0.85em" }}>Low</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "#ffffb2",
                    borderRadius: 3,
                    border: "1px solid #ddd",
                  }}
                />
                <span style={{ fontSize: "0.85em" }}>Very Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Map Area */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
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
                {points.length} points rendered
              </span>
            )}
          </div>

          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: true,
              draggableCursor: "default",
              draggingCursor: "default",
            }}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onIdle={handleMapIdle}
            onZoomChanged={onMapZoomChanged}
          >
            {(selectedPoint || hoveredPoint) && (
              <InfoWindow
                position={{
                  lat: (selectedPoint || hoveredPoint)!.lat,
                  lng: (selectedPoint || hoveredPoint)!.lng,
                }}
                onCloseClick={() => {
                  setSelectedPoint(null);
                }}
              >
                <div style={{ minWidth: 160, maxWidth: 200, fontSize: "0.8em" }}>
                  {(selectedPoint || hoveredPoint)?.imageUrl && (
                    <img
                      src={(selectedPoint || hoveredPoint)!.imageUrl || ""}
                      alt={(selectedPoint || hoveredPoint)!.location}
                      style={{
                        width: "100%",
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 6,
                        marginBottom: 6,
                        display: "block",
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 3,
                      fontSize: "0.85em",
                    }}
                  >
                    {(selectedPoint || hoveredPoint)?.location}
                  </div>
                  <div
                    style={{ fontSize: "0.75em", opacity: 0.85, marginBottom: 2 }}
                  >
                    Address: {(selectedPoint || hoveredPoint)?.location}
                  </div>
                  <div
                    style={{ fontSize: "0.75em", opacity: 0.85, marginBottom: 6 }}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)} intensity:{" "}
                    {(selectedPoint || hoveredPoint)?.weight}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <button
                      onClick={() =>
                        navigate(
                          `/listings/${(selectedPoint || hoveredPoint)!.listingId}`,
                        )
                      }
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "0.75em",
                        fontWeight: 600,
                      }}
                    >
                      View Listing
                    </button>
                    {selectedPoint && (
                      <button
                        onClick={() => setSelectedPoint(null)}
                        style={{
                          padding: "6px 8px",
                          backgroundColor: "#666",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: "0.75em",
                        }}
                      >
                        Unpin
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
            {heatmapLayerData.length === 0 && !loading && (
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
      </div>
    </div>
  );
};

export const HeatMapPage: React.FC = () => {
  const navigate = useNavigate();
  const metric: Metric = "views";
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [searchRadius, setSearchRadius] = useState(50);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(10);
  
  const requestIdRef = useRef(0);
  const boundsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousBoundsRef = useRef<Bounds | null>(null);
  const previousZoomRef = useRef<number>(10);
  const isZoomingRef = useRef<boolean>(false);
  const { isLoaded: isMapsLoaded, loadError } = useJsApiLoader({
    id: "heatmap-google-maps-script",
    googleMapsApiKey: MAPS_KEY,
    libraries: GOOGLE_MAP_LIBRARIES as unknown as ["visualization"],
  });

  const center = useMemo(() => ({ lat: selectedCity.lat, lng: selectedCity.lng }), [selectedCity]);

  useEffect(() => {
    return () => {
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }
    };
  }, []);

  // Calculate distance between two points in km
  const calculateBoundsDistance = (
    bounds1: Bounds,
    bounds2: Bounds,
  ): number => {
    const lat1 = bounds1.neLat;
    const lng1 = bounds1.neLng;
    const lat2 = bounds2.neLat;
    const lng2 = bounds2.neLng;

    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check if bounds changed significantly (more than 10km or zoom changed by 1+)
  const shouldFetchNewData = (newBounds: Bounds, newZoom: number): boolean => {
    if (!previousBoundsRef.current) return true;

    const distance = calculateBoundsDistance(
      newBounds,
      previousBoundsRef.current,
    );
    const zoomDifference = Math.abs(newZoom - previousZoomRef.current);

    return distance > 10 || zoomDifference >= 1;
  };

  const handleMapZoomChanged = () => {
    isZoomingRef.current = true;
  };

  const handleCityChange = (city: City) => {
    setSelectedCity(city);
    setPoints([]); // Clear existing points
    previousBoundsRef.current = null; // Reset bounds
  };

  const handleSearchRadiusChange = (radius: number) => {
    setSearchRadius(radius);
  };

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

      // Build query parameters with bounds if available
      const params = new URLSearchParams({ metric });
      if (bounds) {
        params.append("neLat", bounds.neLat.toString());
        params.append("neLng", bounds.neLng.toString());
        params.append("swLat", bounds.swLat.toString());
        params.append("swLng", bounds.swLng.toString());
      }

      const url = `${API_BASE}/api/heatmap?${params.toString()}`;
      // console.log(`[HeatMap] [request ${requestId}] Fetch start`, {
      //   metric,
      //   bounds,
      //   url,
      //   retryNonce,
      // });

      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch heatmap (${response.status} ${response.statusText})`,
          );
        }

        const payload = await response.json();
        const rawPoints = Array.isArray(payload?.points) ? payload.points : [];
        const validPoints = rawPoints
          .map((point: Partial<HeatPoint>) => ({
            lat: Number(point.lat),
            lng: Number(point.lng),
            weight: Number(point.weight),
            location:
              typeof point.location === "string" &&
              point.location.trim().length > 0
                ? point.location.trim()
                : "Unknown location",
            imageUrl:
              typeof point.imageUrl === "string" &&
              point.imageUrl.trim().length > 0
                ? point.imageUrl
                : null,
            listingId:
              typeof point.listingId === "string" &&
              point.listingId.trim().length > 0
                ? point.listingId
                : "",
          }))
          .filter((point: HeatPoint) => {
            const isValid =
              Number.isFinite(point.lat) &&
              Number.isFinite(point.lng) &&
              Number.isFinite(point.weight) &&
              point.weight > 0 &&
              point.listingId.length > 0;

            if (!isValid) {
              console.warn("[HeatMap] Invalid point filtered out:", point);
            }

            return isValid;
          });

        if (!isActive || requestId !== requestIdRef.current) {
          // console.log(
          //   `[HeatMap] [request ${requestId}] Ignoring stale success`,
          // );
          return;
        }

        // console.log(`[HeatMap] [request ${requestId}] Fetch success`, {
        //   received: rawPoints.length,
        //   valid: validPoints.length,
        // });

        setPoints(validPoints);
      } catch (caughtError) {
        if (!isActive || requestId !== requestIdRef.current) {
          // console.log(
          //   `[HeatMap] [request ${requestId}] Ignoring stale failure`,
          // );
          return;
        }

        if (controller.signal.aborted && !didTimeout) {
          // console.log(`[HeatMap] [request ${requestId}] Fetch aborted`);
          return;
        }

        const message = didTimeout
          ? "Heatmap request timed out. Please try again."
          : caughtError instanceof Error
            ? caughtError.message
            : "Failed to load heatmap";

        console.error(
          `[HeatMap] [request ${requestId}] Fetch failed`,
          caughtError,
        );
        toast.error(message);
        setPoints([]);
        setError(message);
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
      // console.log(`[HeatMap] [request ${requestId}] Cleanup`);
      controller.abort();
    };
  }, [metric, bounds, retryNonce]);

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
      points={points}
      loading={loading}
      error={error}
      center={center}
      onRetry={() => setRetryNonce((current) => current + 1)}
      onMapZoomChanged={handleMapZoomChanged}
      isZoomingRef={isZoomingRef}
      shouldFetchNewData={shouldFetchNewData}
      setBounds={setBounds}
      setRetryNonce={setRetryNonce}
      previousBoundsRef={previousBoundsRef}
      previousZoomRef={previousZoomRef}
      boundsTimeoutRef={boundsTimeoutRef}
      navigate={navigate}
      selectedCity={selectedCity}
      searchRadius={searchRadius}
      onCityChange={handleCityChange}
      onSearchRadiusChange={handleSearchRadiusChange}
      totalListings={points.length}
      listingsInRadius={points.length}
      currentZoomLevel={currentZoomLevel}
      onZoomLevelChange={setCurrentZoomLevel}
    />
  );
};
