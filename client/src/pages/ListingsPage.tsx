import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BellRing,
  FilterX,
  Gauge,
  LayoutGrid,
  List,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { ListingCard } from "../components/listings/ListingCard";
import { ListingRowCard } from "../components/listings/ListingRowCard";
import { useAuth } from "../context/AuthContext";

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

const DEFAULT_YEAR_RANGE: [number, number] = [1990, 2025];
const DEFAULT_PRICE_RANGE: [number, number] = [0, 120000];
const DEFAULT_MILEAGE_RANGE: [number, number] = [0, 200000];

const sanitizeRange = (
  minValue: string,
  maxValue: string,
  fallback: [number, number],
): [number, number] => {
  const parsedMin = Number(minValue);
  const parsedMax = Number(maxValue);

  const safeMin = Number.isFinite(parsedMin) ? parsedMin : fallback[0];
  const safeMax = Number.isFinite(parsedMax) ? parsedMax : fallback[1];

  if (safeMin <= safeMax) {
    return [safeMin, safeMax];
  }

  return [safeMax, safeMin];
};

export const ListingsPage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const locationRouter = useLocation();
  const navigate = useNavigate();

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
  const [locationFilter, setLocationFilter] = useState("");
  const [yearRange, setYearRange] = useState<[number, number]>(
    DEFAULT_YEAR_RANGE,
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(
    DEFAULT_PRICE_RANGE,
  );
  const [mileageRange, setMileageRange] = useState<[number, number]>(
    DEFAULT_MILEAGE_RANGE,
  );
  const [minBids, setMinBids] = useState(0);
  const [endingSoon, setEndingSoon] = useState<boolean>(false);

  const [makeDraft, setMakeDraft] = useState<string>("all");
  const [locationDraft, setLocationDraft] = useState("");
  const [yearMinDraft, setYearMinDraft] = useState(String(DEFAULT_YEAR_RANGE[0]));
  const [yearMaxDraft, setYearMaxDraft] = useState(String(DEFAULT_YEAR_RANGE[1]));
  const [priceMinDraft, setPriceMinDraft] = useState(
    String(DEFAULT_PRICE_RANGE[0]),
  );
  const [priceMaxDraft, setPriceMaxDraft] = useState(
    String(DEFAULT_PRICE_RANGE[1]),
  );
  const [mileageMinDraft, setMileageMinDraft] = useState(
    String(DEFAULT_MILEAGE_RANGE[0]),
  );
  const [mileageMaxDraft, setMileageMaxDraft] = useState(
    String(DEFAULT_MILEAGE_RANGE[1]),
  );
  const [minBidsDraft, setMinBidsDraft] = useState("0");
  const [endingSoonDraft, setEndingSoonDraft] = useState(false);

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

      const data = (await res.json()) as { listings: any[] };

      const mappedListings: Listing[] = data.listings.map((listing: any) => {
        const vehicle = listing.vehicle;
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
          title: vehicle
            ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
            : "Unknown Vehicle",
          thumbnailUrl: vehicle?.image_url
            ? Array.isArray(vehicle.image_url)
              ? vehicle.image_url[0]
              : vehicle.image_url
            : "",
          currentPrice: Number(listing.current_price),
          location: listing.location || "Unknown",
          mileage: Number(vehicle?.mileage_hours ?? 0),
          year: Number(vehicle?.year ?? 0),
          status: derivedStatus,
          startsAt: listing.start_time ?? new Date().toISOString(),
          endsAt: listing.end_time ?? new Date().toISOString(),
          bids: listing.bids_count ?? 0,
        };
      });

      setListings(mappedListings);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch listings";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchListings();

    const interval = window.setInterval(() => {
      void fetchListings();
    }, 30000);

    return () => window.clearInterval(interval);
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
          "http://localhost:8080/api/recommendations/for-you?limit=3",
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = (await res.json()) as { recommendations?: any[] };
        const mapped: Listing[] = Array.isArray(data.recommendations)
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
      if (!derivedMake) {
        return acc;
      }
      acc[derivedMake] = (acc[derivedMake] || 0) + 1;
      return acc;
    }, {});
  }, [listings]);

  const makes = useMemo(() => Object.keys(makeCounts).sort(), [makeCounts]);

  const visibleListings = useMemo(() => {
    return listings
      .filter((listing) => listing.status === status)
      .filter((listing) => {
        const loweredQuery = query.trim().toLowerCase();
        if (!loweredQuery) {
          return true;
        }
        return (
          listing.title.toLowerCase().includes(loweredQuery) ||
          listing.location.toLowerCase().includes(loweredQuery)
        );
      })
      .filter((listing) =>
        make === "all" ? true : listing.title.toLowerCase().includes(make),
      )
      .filter((listing) =>
        locationFilter.trim()
          ? listing.location.toLowerCase().includes(locationFilter.toLowerCase())
          : true,
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
      .filter((listing) => listing.bids >= minBids)
      .filter((listing) => {
        if (!endingSoon) {
          return true;
        }
        const hoursLeft =
          (new Date(listing.endsAt).getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursLeft <= 24;
      })
      .sort((a, b) => {
        if (sort === "price") {
          return b.currentPrice - a.currentPrice;
        }
        if (sort === "bids") {
          return (b.bids ?? 0) - (a.bids ?? 0);
        }
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      });
  }, [
    listings,
    status,
    query,
    make,
    locationFilter,
    yearRange,
    priceRange,
    mileageRange,
    minBids,
    endingSoon,
    sort,
  ]);

  const statusCounts = useMemo(() => {
    return {
      UPCOMING: listings.filter((listing) => listing.status === "UPCOMING")
        .length,
      ACTIVE: listings.filter((listing) => listing.status === "ACTIVE").length,
      EXPIRED: listings.filter((listing) => listing.status === "EXPIRED")
        .length,
    };
  }, [listings]);

  const hasActiveFilters =
    make !== "all" ||
    locationFilter.trim().length > 0 ||
    yearRange[0] !== DEFAULT_YEAR_RANGE[0] ||
    yearRange[1] !== DEFAULT_YEAR_RANGE[1] ||
    priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
    priceRange[1] !== DEFAULT_PRICE_RANGE[1] ||
    mileageRange[0] !== DEFAULT_MILEAGE_RANGE[0] ||
    mileageRange[1] !== DEFAULT_MILEAGE_RANGE[1] ||
    minBids !== 0 ||
    endingSoon ||
    query.trim().length > 0;

  const applyFilters = () => {
    setMake(makeDraft);
    setLocationFilter(locationDraft.trim());
    setYearRange(sanitizeRange(yearMinDraft, yearMaxDraft, DEFAULT_YEAR_RANGE));
    setPriceRange(
      sanitizeRange(priceMinDraft, priceMaxDraft, DEFAULT_PRICE_RANGE),
    );
    setMileageRange(
      sanitizeRange(mileageMinDraft, mileageMaxDraft, DEFAULT_MILEAGE_RANGE),
    );

    const parsedBids = Number(minBidsDraft);
    setMinBids(Number.isFinite(parsedBids) && parsedBids >= 0 ? parsedBids : 0);
    setEndingSoon(endingSoonDraft);
  };

  const resetFilters = () => {
    setMake("all");
    setLocationFilter("");
    setYearRange(DEFAULT_YEAR_RANGE);
    setPriceRange(DEFAULT_PRICE_RANGE);
    setMileageRange(DEFAULT_MILEAGE_RANGE);
    setMinBids(0);
    setEndingSoon(false);
    setSort("ending");
    setQuery("");

    setMakeDraft("all");
    setLocationDraft("");
    setYearMinDraft(String(DEFAULT_YEAR_RANGE[0]));
    setYearMaxDraft(String(DEFAULT_YEAR_RANGE[1]));
    setPriceMinDraft(String(DEFAULT_PRICE_RANGE[0]));
    setPriceMaxDraft(String(DEFAULT_PRICE_RANGE[1]));
    setMileageMinDraft(String(DEFAULT_MILEAGE_RANGE[0]));
    setMileageMaxDraft(String(DEFAULT_MILEAGE_RANGE[1]));
    setMinBidsDraft("0");
    setEndingSoonDraft(false);
  };

  const createAlertPreview = () => {
    setAlertCreated(true);
    window.setTimeout(() => setAlertCreated(false), 2200);
  };

  const adminSummaryCards = useMemo(
    () => [
      {
        label: "Total inventory",
        value: listings.length,
        sub: "All marketplace listings",
        icon: <Shield size={18} />,
      },
      {
        label: "Live now",
        value: statusCounts.ACTIVE,
        sub: "Active auctions being monitored",
        icon: <TrendingUp size={18} />,
      },
      {
        label: "Upcoming",
        value: statusCounts.UPCOMING,
        sub: "Scheduled inventory in pipeline",
        icon: <Target size={18} />,
      },
      {
        label: "Ended",
        value: statusCounts.EXPIRED,
        sub: "Closed or expired listings",
        icon: <Sparkles size={18} />,
      },
    ],
    [
      listings.length,
      statusCounts.ACTIVE,
      statusCounts.EXPIRED,
      statusCounts.UPCOMING,
    ],
  );

  const adminTopMakes = useMemo(() => {
    return Object.entries(makeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [makeCounts]);

  const adminAveragePrice = useMemo(() => {
    if (listings.length === 0) {
      return 0;
    }

    const total = listings.reduce((sum, listing) => sum + listing.currentPrice, 0);
    return Math.round(total / listings.length);
  }, [listings]);

  const adminHighestPriceListing = useMemo(() => {
    if (listings.length === 0) {
      return null;
    }

    return [...listings].sort((a, b) => b.currentPrice - a.currentPrice)[0] ?? null;
  }, [listings]);

  return (
    <section className="market-page">
      <header className="market-header">
        <div>
          <div className="market-context-chip">
            {isAdminView ? "Admin Operations View" : "Marketplace Discovery"}
          </div>
          <h1 className="market-title">
            {isAdminView ? "Marketplace control center" : "Browse vehicles"}
          </h1>
          <p className="market-sub">
            {isAdminView
              ? "Monitor listing health, review inventory mix, and manage live marketplace operations from one admin-focused page."
              : "Find vehicles from across Let's Ride Canada auctions and sales."}
          </p>
        </div>

        <div className="market-header-actions">
          <div className="market-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAdminView
                  ? "Search inventory by year, make, model, or location..."
                  : "Search by year, make, model, or location..."
              }
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

      <div className="market-layout">
        <aside className="market-sidebar">
          {isAdminView ? (
            <>
              <div className="sidebar-title sidebar-title-admin">
                <Shield size={18} /> Admin cockpit
              </div>

              <div className="admin-sidebar-hero">
                <div>
                  <div className="admin-sidebar-label">Inventory pulse</div>
                  <h3>Fast operational read</h3>
                  <p>
                    Live overview of marketplace inventory and activity.
                  </p>
                </div>
                <button
                  className="btn btn-primary sidebar-action-btn"
                  onClick={() => void fetchListings(true)}
                  type="button"
                >
                  <RefreshCw size={16} /> Refresh inventory
                </button>
              </div>

              <div className="admin-stat-grid">
                {adminSummaryCards.map((card) => (
                  <div key={card.label} className="admin-stat-card">
                    <div className="admin-stat-icon">{card.icon}</div>
                    <div className="admin-stat-label">{card.label}</div>
                    <div className="admin-stat-value">{card.value}</div>
                    <div className="admin-stat-sub">{card.sub}</div>
                  </div>
                ))}
              </div>

              <div className="sidebar-block admin-utility-card">
                <div className="sidebar-label">Quick insights</div>
                <div className="admin-insight-row">
                  <span>Average current price</span>
                  <strong>${adminAveragePrice.toLocaleString()}</strong>
                </div>
                <div className="admin-insight-row">
                  <span>Highest priced unit</span>
                  <strong>
                    {adminHighestPriceListing
                      ? `$${adminHighestPriceListing.currentPrice.toLocaleString()}`
                      : "—"}
                  </strong>
                </div>
                <div className="admin-insight-row admin-insight-row-stack">
                  <span>Top listing</span>
                  <strong>
                    {adminHighestPriceListing?.title ?? "No listings available"}
                  </strong>
                </div>
              </div>

              <div className="sidebar-block admin-utility-card">
                <div className="sidebar-label">Inventory mix by make</div>
                {adminTopMakes.length === 0 ? (
                  <p className="sidebar-hint" style={{ marginTop: 0 }}>
                    No inventory data available yet.
                  </p>
                ) : (
                  <div className="admin-make-list">
                    {adminTopMakes.map(([adminMake, count]) => (
                      <div key={adminMake} className="admin-make-row">
                        <span>{adminMake.toUpperCase()}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sidebar-block admin-utility-card">
                <div className="sidebar-label">Display mode</div>
                <div className="view-toggle">
                  <button
                    className={view === "list" ? "view-btn active" : "view-btn"}
                    onClick={() => setView("list")}
                    type="button"
                  >
                    <List size={15} /> List
                  </button>
                  <button
                    className={view === "grid" ? "view-btn active" : "view-btn"}
                    onClick={() => setView("grid")}
                    type="button"
                  >
                    <LayoutGrid size={15} /> Grid
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-title">
                <Target size={18} /> Search filters
              </div>

              <div className="sidebar-block">
                <div className="sidebar-label">Make</div>
                <select
                  className="select select-outline filter-input"
                  value={makeDraft}
                  onChange={(e) => setMakeDraft(e.target.value)}
                >
                  <option value="all">All makes</option>
                  {makes.map((item) => (
                    <option key={item} value={item}>
                      {item.toUpperCase()} ({makeCounts[item]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sidebar-block">
                <div className="sidebar-label">Location</div>
                <input
                  className="filter-input"
                  value={locationDraft}
                  onChange={(e) => setLocationDraft(e.target.value)}
                  placeholder="Any city or province"
                  type="text"
                />
              </div>

              <div className="sidebar-block">
                <div className="sidebar-label">Year range</div>
                <div className="filter-range-grid">
                  <input
                    className="filter-input"
                    value={yearMinDraft}
                    onChange={(e) => setYearMinDraft(e.target.value)}
                    placeholder="Min year"
                    type="number"
                  />
                  <input
                    className="filter-input"
                    value={yearMaxDraft}
                    onChange={(e) => setYearMaxDraft(e.target.value)}
                    placeholder="Max year"
                    type="number"
                  />
                </div>
              </div>

              <div className="sidebar-block">
                <div className="sidebar-label">Price range</div>
                <div className="filter-range-grid">
                  <input
                    className="filter-input"
                    value={priceMinDraft}
                    onChange={(e) => setPriceMinDraft(e.target.value)}
                    placeholder="Min price"
                    type="number"
                  />
                  <input
                    className="filter-input"
                    value={priceMaxDraft}
                    onChange={(e) => setPriceMaxDraft(e.target.value)}
                    placeholder="Max price"
                    type="number"
                  />
                </div>
              </div>

              <div className="sidebar-block">
                <div className="sidebar-label">Mileage range</div>
                <div className="filter-range-grid">
                  <input
                    className="filter-input"
                    value={mileageMinDraft}
                    onChange={(e) => setMileageMinDraft(e.target.value)}
                    placeholder="Min km"
                    type="number"
                  />
                  <input
                    className="filter-input"
                    value={mileageMaxDraft}
                    onChange={(e) => setMileageMaxDraft(e.target.value)}
                    placeholder="Max km"
                    type="number"
                  />
                </div>
              </div>

              <div className="sidebar-block sidebar-two-column-grid">
                <div>
                  <div className="sidebar-label">Minimum bids</div>
                  <input
                    className="filter-input"
                    value={minBidsDraft}
                    onChange={(e) => setMinBidsDraft(e.target.value)}
                    placeholder="0"
                    type="number"
                    min="0"
                  />
                </div>

                <div>
                  <div className="sidebar-label">Sort</div>
                  <select
                    className="select select-outline filter-input"
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
              </div>

              <div className="sidebar-block sidebar-two-column-grid">
                <div>
                  <div className="sidebar-label">View</div>
                  <div className="view-toggle">
                    <button
                      className={view === "list" ? "view-btn active" : "view-btn"}
                      onClick={() => setView("list")}
                      type="button"
                    >
                      <List size={15} /> List
                    </button>
                    <button
                      className={view === "grid" ? "view-btn active" : "view-btn"}
                      onClick={() => setView("grid")}
                      type="button"
                    >
                      <LayoutGrid size={15} /> Grid
                    </button>
                  </div>
                </div>

                <div className="sidebar-checkbox-wrap">
                  <div className="sidebar-label">Quick toggle</div>
                  <label className="sidebar-checkbox modern-checkbox">
                    <input
                      type="checkbox"
                      checked={endingSoonDraft}
                      onChange={(e) => setEndingSoonDraft(e.target.checked)}
                    />
                    <span>Ending within 24 hours</span>
                  </label>
                </div>
              </div>

              <div className="sidebar-block filter-actions enhanced-filter-actions">
                <button
                  className="btn btn-primary sidebar-action-btn"
                  onClick={applyFilters}
                  type="button"
                >
                  <Target size={16} /> Search with these filters
                </button>
                <button
                  className="btn btn-outline sidebar-action-btn"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  type="button"
                >
                  <FilterX size={16} /> Clear filters
                </button>
              </div>

              <div className="sidebar-block alert-preview-card alert-preview-card-upgraded">
                <div className="alert-preview-title">
                  <BellRing size={16} /> Create email alert
                </div>
                <p className="alert-preview-copy">
                  Save this search setup and be notified when matching inventory is
                  listed.
                </p>
                <div className="alert-preview-values">
                  <span>{make === "all" ? "Any make" : make.toUpperCase()}</span>
                  <span>{locationFilter || "Any location"}</span>
                  <span>
                    ${priceRange[0].toLocaleString()} - $
                    {priceRange[1].toLocaleString()}
                  </span>
                  <span>
                    {yearRange[0]} - {yearRange[1]}
                  </span>
                </div>
                <button
                  className="btn btn-primary sidebar-action-btn"
                  onClick={createAlertPreview}
                  type="button"
                >
                  <BellRing size={16} /> Create alert
                </button>
                {alertCreated && (
                  <div className="alert-success-banner">
                    Alert saved for these filters. Backend trigger can be connected
                    later.
                  </div>
                )}
              </div>

              {!isLoggedIn && (
                <div className="sidebar-hint">
                  Tip: Browse in Guest mode, then sign in to bid, watch, and save
                  alerts.
                </div>
              )}
            </>
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
              onClick={() => void fetchListings(true)}
              title="Refresh listings"
              disabled={loading || refreshing}
              type="button"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {!isAdminView && isLoggedIn && (
            <section className="recommended-strip">
              <div className="recommended-strip-header">
                <div>
                  <h2>Recommended for you</h2>
                  <p>
                    Personalized picks based on your recent marketplace activity.
                  </p>
                </div>
              </div>

              {recommendationsLoading && (
                <p className="recommended-empty-state">Loading recommendations...</p>
              )}

              {!recommendationsLoading && recommendedListings.length === 0 && (
                <p className="recommended-empty-state">
                  Browse a few listings or place a bid and we&apos;ll start tailoring
                  suggestions here.
                </p>
              )}

              {!recommendationsLoading && recommendedListings.length > 0 && (
                <div className="recommended-strip-grid">
                  {recommendedListings.map((listing) => (
                    <article
                      key={`rec-${listing.id}`}
                      className="recommended-mini-card"
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          navigate(`/listings/${listing.id}`);
                        }
                      }}
                    >
                      <img
                        src={
                          listing.thumbnailUrl ||
                          "https://placehold.co/800x500?text=Vehicle"
                        }
                        alt={listing.title}
                        className="recommended-mini-image"
                      />
                      <div className="recommended-mini-body">
                        <div className="recommended-mini-topline">
                          <span className="recommended-mini-badge">Recommended</span>
                          <span className="recommended-mini-score">
                            {Math.round((listing.recommendationScore ?? 0) * 100)}%
                            {" "}
                            match
                          </span>
                        </div>
                        <h3>{listing.title}</h3>
                        <div className="recommended-mini-meta">
                          <span>
                            <MapPin size={14} /> {listing.location}
                          </span>
                          <span>
                            <Gauge size={14} /> {listing.mileage.toLocaleString()} km
                          </span>
                        </div>
                        <div className="recommended-mini-price-row">
                          <strong>${listing.currentPrice.toLocaleString()}</strong>
                          <span>{listing.bids} bids</span>
                        </div>
                        <p>{listing.explanation ?? "Recommended from your activity"}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {hasActiveFilters && !isAdminView && (
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

              {locationFilter && (
                <button
                  className="filter-pill"
                  onClick={() => setLocationFilter("")}
                  type="button"
                >
                  {locationFilter}
                  <X size={13} />
                </button>
              )}

              {(yearRange[0] !== DEFAULT_YEAR_RANGE[0] ||
                yearRange[1] !== DEFAULT_YEAR_RANGE[1]) && (
                <button
                  className="filter-pill"
                  onClick={() => setYearRange(DEFAULT_YEAR_RANGE)}
                  type="button"
                >
                  Year {yearRange[0]} - {yearRange[1]}
                  <X size={13} />
                </button>
              )}

              {(priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
                priceRange[1] !== DEFAULT_PRICE_RANGE[1]) && (
                <button
                  className="filter-pill"
                  onClick={() => setPriceRange(DEFAULT_PRICE_RANGE)}
                  type="button"
                >
                  ${priceRange[0].toLocaleString()} - $
                  {priceRange[1].toLocaleString()}
                  <X size={13} />
                </button>
              )}

              {(mileageRange[0] !== DEFAULT_MILEAGE_RANGE[0] ||
                mileageRange[1] !== DEFAULT_MILEAGE_RANGE[1]) && (
                <button
                  className="filter-pill"
                  onClick={() => setMileageRange(DEFAULT_MILEAGE_RANGE)}
                  type="button"
                >
                  {mileageRange[0].toLocaleString()} -{" "}
                  {mileageRange[1].toLocaleString()} km
                  <X size={13} />
                </button>
              )}

              {minBids > 0 && (
                <button
                  className="filter-pill"
                  onClick={() => setMinBids(0)}
                  type="button"
                >
                  {minBids}+ bids
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
            {loading && <p className="loading-state-text">Loading listings...</p>}

            {error && <p className="error">{error}</p>}

            {!loading && !error && visibleListings.length === 0 && (
              <div className="no-results-card">
                <h3>No listings match those filters</h3>
                <p>
                  Try widening your price, mileage, or year range, or clear filters
                  to see more inventory.
                </p>
                <button className="btn btn-primary" onClick={resetFilters} type="button">
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