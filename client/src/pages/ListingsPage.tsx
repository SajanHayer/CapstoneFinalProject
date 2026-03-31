import React, { useEffect, useMemo, useState } from "react";
import { ListingCard } from "../components/listings/ListingCard";
import { ListingRowCard } from "../components/listings/ListingRowCard";
import {
  BellRing,
  FilterX,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

export type ListingStatus = "UPCOMING" | "ACTIVE" | "EXPIRED";

export interface Listing {
  id: string;
  title: string;
  thumbnailUrl: string;
  currentPrice: number;
  location: string;
  mileage: number;
  year: number;
  status: ListingStatus;
  startsAt: string;
  endsAt: string;
  bids: number;
  explanation?: string;
  recommendationScore?: number;
  explanationBullets?: string[];
}

type RangeTuple = [number, number];

const clampRange = (
  nextMin: number,
  nextMax: number,
  minGap: number,
  absoluteMin: number,
  absoluteMax: number,
): RangeTuple => {
  const safeMin = Math.max(absoluteMin, Math.min(nextMin, nextMax - minGap));
  const safeMax = Math.min(absoluteMax, Math.max(nextMax, safeMin + minGap));
  return [safeMin, safeMax];
};

const getTrackBackground = (
  values: RangeTuple,
  min: number,
  max: number,
  inactive = "#555",
  active = "#4f7cff",
) => {
  const left = ((values[0] - min) / (max - min)) * 100;
  const right = ((values[1] - min) / (max - min)) * 100;

  return `linear-gradient(to right,
    ${inactive} 0%,
    ${inactive} ${left}%,
    ${active} ${left}%,
    ${active} ${right}%,
    ${inactive} ${right}%,
    ${inactive} 100%)`;
};

interface DualRangeSliderProps {
  min: number;
  max: number;
  step: number;
  values: RangeTuple;
  onChange: (values: RangeTuple) => void;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step,
  values,
  onChange,
}) => {
  const [minVal, maxVal] = values;

  return (
    <div
      style={{
        position: "relative",
        height: "28px",
        marginTop: "12px",
        marginBottom: "6px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          height: "6px",
          borderRadius: "999px",
          background: getTrackBackground(values, min, max),
          pointerEvents: "none",
        }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={(e) => {
          const next = clampRange(
            Number(e.target.value),
            maxVal,
            step,
            min,
            max,
          );
          onChange(next);
        }}
        style={{
          position: "absolute",
          width: "100%",
          height: "28px",
          background: "transparent",
          pointerEvents: "auto",
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={(e) => {
          const next = clampRange(
            minVal,
            Number(e.target.value),
            step,
            min,
            max,
          );
          onChange(next);
        }}
        style={{
          position: "absolute",
          width: "100%",
          height: "28px",
          background: "transparent",
          pointerEvents: "auto",
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />

      <style>
        {`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: #4f7cff;
            border: 3px solid white;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            cursor: pointer;
            margin-top: -6px;
            position: relative;
            z-index: 3;
          }

          input[type="range"]::-webkit-slider-runnable-track {
            height: 6px;
            background: transparent;
          }

          input[type="range"]::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: #4f7cff;
            border: 3px solid white;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            cursor: pointer;
            position: relative;
            z-index: 3;
          }

          input[type="range"]::-moz-range-track {
            height: 6px;
            background: transparent;
          }
        `}
      </style>
    </div>
  );
};

export const ListingsPage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const locationRouter = useLocation();

  const isAdminView =
    locationRouter.pathname === "/admin/listings" && user?.role === "admin";

  const [status, setStatus] = useState<ListingStatus>("ACTIVE");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"ending" | "price" | "bids">("ending");
  const [make, setMake] = useState<string>("all");

  const [yearRange, setYearRange] = useState<RangeTuple>([1990, 2025]);
  const [priceRange, setPriceRange] = useState<RangeTuple>([0, 120000]);
  const [mileageRange, setMileageRange] = useState<RangeTuple>([0, 200000]);
  const [endingSoon, setEndingSoon] = useState<boolean>(false);

  const [alertCreated, setAlertCreated] = useState(false);
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const fetchListings = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const endpoint = isAdminView
        ? "http://localhost:8080/api/listings/admin/all"
        : "http://localhost:8080/api/listings";

      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (!res.ok) {
        toast.error("Failed to load listings");
        throw new Error("Failed to fetch listings");
      }

      const data = await res.json();

      const mappedListings: Listing[] = data.listings.map((listing: any) => {
        const v = listing.vehicle;
        const now = new Date();
        const startTime = new Date(listing.start_time);
        const endTime = new Date(listing.end_time);

        let derivedStatus: ListingStatus;
        if (now < startTime) {
          derivedStatus = "UPCOMING";
        } else if (
          now >= startTime &&
          now < endTime &&
          listing.status === "active"
        ) {
          derivedStatus = "ACTIVE";
        } else {
          derivedStatus = "EXPIRED";
        }

        return {
          id: listing.id.toString(),
          title: v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle",
          thumbnailUrl: v?.image_url
            ? Array.isArray(v.image_url)
              ? v.image_url[0]
              : v.image_url
            : "",
          currentPrice: Number(listing.current_price),
          location: listing.location || "Unknown",
          mileage: Number(v?.mileage_hours ?? 0),
          year: Number(v?.year ?? 0),
          status: derivedStatus,
          startsAt: listing.start_time ?? new Date().toISOString(),
          endsAt: listing.end_time ?? new Date().toISOString(),
          bids: listing.bids_count ?? 0,
        };
      });

      setListings(mappedListings);
    } catch (err: any) {
      setError(err.message || "Failed to fetch listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();

    const interval = setInterval(() => {
      fetchListings();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdminView]);

  useEffect(() => {
    if (!user?.id || isAdminView) {
      setRecommendedListings([]);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setRecommendationsLoading(true);
        const res = await fetch(
          "http://localhost:8080/api/recommendations/for-you?limit=4",
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await res.json();
        const mapped: Listing[] = Array.isArray(data?.recommendations)
          ? data.recommendations.map((item: any) => ({
              id: String(item.id),
              title: String(item.title),
              thumbnailUrl: String(item.thumbnailUrl ?? ""),
              currentPrice: Number(item.currentPrice ?? 0),
              location: String(item.location ?? "Unknown"),
              mileage: Number(item.mileage ?? 0),
              year: Number(item.year ?? 0),
              status: item.status as ListingStatus,
              startsAt: String(item.startsAt ?? new Date().toISOString()),
              endsAt: String(item.endsAt ?? new Date().toISOString()),
              bids: Number(item.bids ?? 0),
              explanation: Array.isArray(item.explanations)
                ? item.explanations[0]
                : "Recommended from your recent activity",
              explanationBullets: Array.isArray(item.explanations)
                ? item.explanations.map(String)
                : [],
              recommendationScore: Number(item.recommendationScore ?? 0),
            }))
          : [];

        setRecommendedListings(mapped);
      } catch (err) {
        console.warn("[Recommendations] Failed to load recommendations", err);
        setRecommendedListings([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    void fetchRecommendations();
  }, [user?.id, isAdminView]);

  const makeCounts = useMemo(() => {
    return listings.reduce<Record<string, number>>((acc, listing) => {
      const derivedMake = listing.title.split(" ")[1]?.toLowerCase();
      if (!derivedMake) return acc;
      acc[derivedMake] = (acc[derivedMake] || 0) + 1;
      return acc;
    }, {});
  }, [listings]);

  const makes = useMemo(() => Object.keys(makeCounts).sort(), [makeCounts]);

  const visibleListings = useMemo(() => {
    return listings
      .filter((listing) => listing.status === status)
      .filter((listing) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          listing.title.toLowerCase().includes(q) ||
          listing.location.toLowerCase().includes(q)
        );
      })
      .filter((listing) =>
        make === "all" ? true : listing.title.toLowerCase().includes(make),
      )
      .filter(
        (listing) =>
          listing.year >= yearRange[0] && listing.year <= yearRange[1],
      )
      .filter(
        (listing) =>
          listing.currentPrice >= priceRange[0] &&
          listing.currentPrice <= priceRange[1],
      )
      .filter(
        (listing) =>
          listing.mileage >= mileageRange[0] &&
          listing.mileage <= mileageRange[1],
      )
      .filter((listing) => {
        if (!endingSoon) return true;
        const hoursLeft =
          (new Date(listing.endsAt).getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursLeft <= 24;
      })
      .sort((a, b) => {
        if (sort === "price") return b.currentPrice - a.currentPrice;
        if (sort === "bids") return (b.bids ?? 0) - (a.bids ?? 0);
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      });
  }, [
    listings,
    status,
    query,
    make,
    yearRange,
    priceRange,
    mileageRange,
    endingSoon,
    sort,
  ]);

  const hasActiveFilters =
    make !== "all" ||
    yearRange[0] !== 1990 ||
    yearRange[1] !== 2025 ||
    priceRange[0] !== 5000 ||
    priceRange[1] !== 120000 ||
    mileageRange[0] !== 0 ||
    mileageRange[1] !== 200000 ||
    endingSoon ||
    query.trim().length > 0;

  const resetFilters = () => {
    setMake("all");
    setYearRange([1990, 2025]);
    setPriceRange([0, 120000]);
    setMileageRange([0, 200000]);
    setEndingSoon(false);
    setQuery("");
    setSort("ending");
  };

  const createAlertPreview = () => {
    setAlertCreated(true);
    window.setTimeout(() => setAlertCreated(false), 2200);
  };

  const statusCounts = useMemo(() => {
    return {
      UPCOMING: listings.filter((l) => l.status === "UPCOMING").length,
      ACTIVE: listings.filter((l) => l.status === "ACTIVE").length,
      EXPIRED: listings.filter((l) => l.status === "EXPIRED").length,
    };
  }, [listings]);

  return (
    <section className="market-page">
      <header className="market-header">
        <div>
          <h1 className="market-title">
            {isAdminView ? "Admin listing management" : "Browse vehicles"}
          </h1>
          <p className="market-sub">
            {isAdminView
              ? "View all marketplace listings, including internal admin-visible inventory states."
              : "Find vehicles from across Let&apos;s Ride Canada auctions and sales."}
          </p>
        </div>

        <div className="market-header-actions">
          <div className="market-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by year, make, model, or location..."
            />
            {query && (
              <button
                className="search-clear-btn"
                onClick={() => setQuery("")}
                title="Clear search"
                type="button"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="market-tabs">
        {(["UPCOMING", "ACTIVE", "EXPIRED"] as ListingStatus[]).map(
          (tabStatus) => (
            <button
              key={tabStatus}
              className={
                tabStatus === status
                  ? "market-tab market-tab-active"
                  : "market-tab"
              }
              onClick={() => setStatus(tabStatus)}
            >
              <div className="market-tab-label">
                {tabStatus === "EXPIRED"
                  ? "Ended"
                  : tabStatus[0] + tabStatus.slice(1).toLowerCase()}
              </div>
              <div className="market-tab-sub">
                {tabStatus === "UPCOMING"
                  ? `${statusCounts.UPCOMING} scheduled auctions`
                  : tabStatus === "ACTIVE"
                    ? `${statusCounts.ACTIVE} live opportunities`
                    : `${statusCounts.EXPIRED} recently closed`}
              </div>
            </button>
          ),
        )}
      </div>

      {isLoggedIn && !isAdminView && (
        <section
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ marginBottom: "0.9rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
              Recommended for you
            </h2>
            <p style={{ margin: "0.35rem 0 0", opacity: 0.78 }}>
              Transparent picks based on your recent listing views, bids, and
              similar marketplace activity.
            </p>
          </div>

          {recommendationsLoading && (
            <p style={{ margin: 0 }}>Loading recommendations...</p>
          )}

          {!recommendationsLoading && recommendedListings.length === 0 && (
            <p style={{ margin: 0, opacity: 0.78 }}>
              Browse a few listings or place a bid and we&apos;ll start
              tailoring suggestions here.
            </p>
          )}

          {!recommendationsLoading && recommendedListings.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              {recommendedListings.map((listing) => (
                <div key={`rec-${listing.id}`}>
                  <ListingCard listing={listing} />
                  <div
                    style={{
                      marginTop: "0.7rem",
                      padding: "0.85rem",
                      borderRadius: "14px",
                      background: "rgba(0,0,0,0.18)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.82rem",
                        opacity: 0.72,
                        marginBottom: "0.35rem",
                      }}
                    >
                      Why this was recommended
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: "0.45rem" }}>
                      {listing.explanation}
                    </div>
                    {listing.explanationBullets
                      ?.slice(1)
                      .map((bullet, index) => (
                        <div
                          key={`${listing.id}-reason-${index}`}
                          style={{
                            fontSize: "0.9rem",
                            opacity: 0.8,
                            marginTop: "0.25rem",
                          }}
                        >
                          {bullet}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="market-layout">
        <aside className="market-sidebar">
          <div className="sidebar-title">
            <SlidersHorizontal size={18} /> Filters
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Make</div>
            <select
              className="select select-outline"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            >
              <option value="all">All makes</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()} ({makeCounts[m]})
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Year range</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: "4px",
              }}
            >
              <span>{yearRange[0]}</span>
              <strong>{yearRange[1]}</strong>
            </div>
            <DualRangeSlider
              min={1990}
              max={2025}
              step={1}
              values={yearRange}
              onChange={setYearRange}
            />
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Price range</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: "4px",
              }}
            >
              <span>${priceRange[0].toLocaleString()}</span>
              <strong>${priceRange[1].toLocaleString()}</strong>
            </div>
            <DualRangeSlider
              min={0}
              max={120000}
              step={1000}
              values={priceRange}
              onChange={setPriceRange}
            />
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Mileage range</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: "4px",
              }}
            >
              <span>{mileageRange[0].toLocaleString()} km</span>
              <strong>{mileageRange[1].toLocaleString()} km</strong>
            </div>
            <DualRangeSlider
              min={0}
              max={200000}
              step={5000}
              values={mileageRange}
              onChange={setMileageRange}
            />
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Sort</div>
            <select
              className="select select-outline"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as "ending" | "price" | "bids")
              }
            >
              <option value="ending">Ending soonest</option>
              <option value="price">Price: high to low</option>
              <option value="bids">Most bids</option>
            </select>
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">View</div>
            <div className="view-toggle">
              <button
                className={view === "list" ? "view-btn active" : "view-btn"}
                onClick={() => setView("list")}
                type="button"
              >
                List
              </button>
              <button
                className={view === "grid" ? "view-btn active" : "view-btn"}
                onClick={() => setView("grid")}
                type="button"
              >
                Grid
              </button>
            </div>
          </div>

          <div className="sidebar-block sidebar-checkbox-block">
            <label className="sidebar-checkbox">
              <input
                type="checkbox"
                checked={endingSoon}
                onChange={(e) => setEndingSoon(e.target.checked)}
              />
              <span>Ending within 24 hours</span>
            </label>
          </div>

          <div className="sidebar-block filter-actions">
            <button
              className="btn btn-outline sidebar-action-btn"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              type="button"
            >
              <FilterX size={16} />
              Clear filters
            </button>
          </div>

          <div className="sidebar-block alert-preview-card">
            <div className="alert-preview-title">
              <BellRing size={16} />
              Create email alert
            </div>
            <p className="alert-preview-copy">
              Save your current filters and get notified when matching vehicles
              are listed.
            </p>
            <div className="alert-preview-values">
              <span>{make === "all" ? "Any make" : make.toUpperCase()}</span>
              <span>
                {yearRange[0]} - {yearRange[1]}
              </span>
              <span>
                ${priceRange[0].toLocaleString()} - $
                {priceRange[1].toLocaleString()}
              </span>
              <span>
                {mileageRange[0].toLocaleString()} -{" "}
                {mileageRange[1].toLocaleString()} km
              </span>
            </div>
            <button
              className="btn btn-primary sidebar-action-btn"
              onClick={createAlertPreview}
              type="button"
            >
              <BellRing size={16} />
              Create alert
            </button>
            {alertCreated && (
              <div className="alert-success-banner">
                Alert saved for these filters. Backend trigger can be connected
                later.
              </div>
            )}
          </div>

          {!isLoggedIn && !isAdminView && (
            <div className="sidebar-hint">
              Tip: Browse in Guest mode, then sign in to bid, watch, and save
              alerts.
            </div>
          )}
        </aside>

        <div className="market-results">
          <div className="market-results-top">
            <div className="market-results-summary">
              <div className="results-count">
                {loading ? "Loading…" : `${visibleListings.length} results`}
              </div>
              <div className="results-subtext">
                {isAdminView
                  ? "Admin view of marketplace inventory"
                  : status === "ACTIVE"
                    ? "Live inventory updating every 30 seconds"
                    : status === "UPCOMING"
                      ? "Preview scheduled auctions before they go live"
                      : "Recently closed marketplace listings"}
              </div>
            </div>

            <button
              className={`refresh-button ${refreshing ? "refreshing" : ""}`}
              onClick={() => fetchListings(true)}
              title="Refresh listings"
              disabled={loading || refreshing}
              type="button"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {hasActiveFilters && (
            <div className="active-filters">
              {query.trim() && (
                <button
                  className="filter-pill"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  Search: {query}
                  <X size={13} />
                </button>
              )}

              {make !== "all" && (
                <button
                  className="filter-pill"
                  onClick={() => setMake("all")}
                  type="button"
                >
                  {make.toUpperCase()}
                  <X size={13} />
                </button>
              )}

              {(yearRange[0] !== 1990 || yearRange[1] !== 2025) && (
                <button
                  className="filter-pill"
                  onClick={() => setYearRange([1990, 2025])}
                  type="button"
                >
                  Year {yearRange[0]} - {yearRange[1]}
                  <X size={13} />
                </button>
              )}

              {(priceRange[0] !== 5000 || priceRange[1] !== 120000) && (
                <button
                  className="filter-pill"
                  onClick={() => setPriceRange([5000, 120000])}
                  type="button"
                >
                  ${priceRange[0].toLocaleString()} - $
                  {priceRange[1].toLocaleString()}
                  <X size={13} />
                </button>
              )}

              {(mileageRange[0] !== 0 || mileageRange[1] !== 200000) && (
                <button
                  className="filter-pill"
                  onClick={() => setMileageRange([0, 200000])}
                  type="button"
                >
                  {mileageRange[0].toLocaleString()} -{" "}
                  {mileageRange[1].toLocaleString()} km
                  <X size={13} />
                </button>
              )}

              {endingSoon && (
                <button
                  className="filter-pill"
                  onClick={() => setEndingSoon(false)}
                  type="button"
                >
                  Ending soon
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          <div
            className={
              view === "grid"
                ? "listings-grid listings-frame"
                : "listings-list listings-frame"
            }
            style={{ minHeight: "540px" }}
          >
            {loading && (
              <p className="loading-state-text">Loading listings...</p>
            )}

            {error && <p className="error">{error}</p>}

            {!loading && !error && visibleListings.length === 0 && (
              <div className="no-results-card">
                <h3>No listings match those filters</h3>
                <p>
                  Try widening your price, mileage, or year range, or clear
                  filters to see more inventory.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={resetFilters}
                  type="button"
                >
                  Reset filters
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              visibleListings.map((listing) =>
                view === "grid" ? (
                  <ListingCard key={listing.id} listing={listing} />
                ) : (
                  <ListingRowCard key={listing.id} listing={listing} />
                ),
              )}
          </div>
        </div>
      </div>
    </section>
  );
};