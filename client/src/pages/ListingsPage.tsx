import React, { useState, useEffect } from "react";
import { ListingCard } from "../components/listings/ListingCard";
import { ListingRowCard } from "../components/listings/ListingRowCard";
import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";
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
}

export const ListingsPage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [status, setStatus] = useState<ListingStatus>("ACTIVE");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"ending" | "price" | "bids">("ending");
  const [make, setMake] = useState<string>("all");

  // Fetch listings from backend
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://localhost:8080/api/listings", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch listings");

      const data = await res.json();
      // Map backend data to Listing type
      const mappedListings: Listing[] = data.listings.map((listing: any) => {
        const v = listing.vehicle;
        const now = new Date();
        const startTime = new Date(listing.start_time);
        const endTime = new Date(listing.end_time);

        // Determine status based on start_time and end_time
        let status: ListingStatus;
        if (now < startTime) {
          status = "UPCOMING"; // Scheduled for future
        } else if (now >= startTime && now < endTime && listing.status === "active") {
          status = "ACTIVE"; // Currently running
        } else {
          status = "EXPIRED"; // Ended or cancelled
        }

        return {
          id: listing.vehicle.id.toString(),
          title: v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle",
          thumbnailUrl: v?.image_url
            ? Array.isArray(v.image_url)
              ? v.image_url[0]
              : v.image_url
            : undefined,
          currentPrice: Number(listing.current_price),
          location: listing.location || "Unknown",
          mileage: Number(v?.mileage_hours ?? 0),
          year: Number(v?.year ?? 0),
          status: status,
          startsAt: listing.start_time ?? new Date().toISOString(),
          endsAt: listing.end_time ?? new Date().toISOString(),
          bids: listing.bids_count ?? 0,
        };
      });

      setListings(mappedListings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchListings, 30000);

    return () => clearInterval(interval);
  }, []);

  // Derived filter/sort
  const makes = Array.from(
    new Set(
      listings
        .map((l) => l.title.split(" ")[1])
        .filter(Boolean)
        .map((m) => m.toLowerCase()),
    ),
  ).sort();

  const visibleListings = listings
    .filter((l) => l.status === status)
    .filter((l) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    })
    .filter((l) => (make === "all" ? true : l.title.toLowerCase().includes(make)))
    .sort((a, b) => {
      if (sort === "price") return b.currentPrice - a.currentPrice;
      if (sort === "bids") return (b.bids ?? 0) - (a.bids ?? 0);
      // ending
      return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
    });

  return (
    <section className="market-page">
      <header className="market-header">
        <div>
          <h1 className="market-title">Browse vehicles</h1>
          <p className="market-sub">Find vehicles from across Power BIDZ auctions and sales.</p>
        </div>

        <div className="market-header-actions">
          <div className="market-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by year, make & model, or location..."
            />
          </div>
        </div>
      </header>

      <div className="market-tabs">
        {(["UPCOMING", "ACTIVE", "EXPIRED"] as ListingStatus[]).map((s) => (
          <button
            key={s}
            className={s === status ? "market-tab market-tab-active" : "market-tab"}
            onClick={() => setStatus(s)}
          >
            <div className="market-tab-label">{s === "EXPIRED" ? "Ended" : s[0] + s.slice(1).toLowerCase()}</div>
            <div className="market-tab-sub">
              {s === "UPCOMING"
                ? "Preview & proxy before Active"
                : s === "ACTIVE"
                  ? "Always-on time-boxed auctions"
                  : "Recently closed listings"}
            </div>
          </button>
        ))}
      </div>

      <div className="market-layout">
        <aside className="market-sidebar">
          <div className="sidebar-title">
            <SlidersHorizontal size={18} /> Filters
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Make</div>
            <select className="select select-outline" value={make} onChange={(e) => setMake(e.target.value)}>
              <option value="all">All</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Sort</div>
            <select className="select select-outline" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="ending">Ending soonest</option>
              <option value="price">Price: high to low</option>
              <option value="bids">Most bids</option>
            </select>
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">View</div>
            <div className="view-toggle">
              <button className={view === "list" ? "view-btn active" : "view-btn"} onClick={() => setView("list")}>List</button>
              <button className={view === "grid" ? "view-btn active" : "view-btn"} onClick={() => setView("grid")}>Grid</button>
            </div>
          </div>

          {!isLoggedIn && (
            <div className="sidebar-hint">
              Tip: Use Guest mode to browse. Sign in to bid, watch, and sell.
            </div>
          )}
        </aside>

        <div className="market-results">
          <div className="market-results-top">
            <div className="results-count">
              {loading ? "Loading…" : `${visibleListings.length} results`}
            </div>
            <button 
              className="refresh-button"
              onClick={fetchListings}
              title="Refresh listings"
              disabled={loading}
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className={view === "grid" ? "listings-grid" : "listings-list"}>
        {loading && <p>Loading listings...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && visibleListings.length === 0 && (
          <p>No listings in this category yet.</p>
        )}
        {!loading &&
          !error &&
          visibleListings.map((l) =>
            view === "grid" ? (
              <ListingCard key={l.id} listing={l} />
            ) : (
              <ListingRowCard key={l.id} listing={l} />
            ),
          )}
          </div>
        </div>
      </div>
    </section>
  );
};
