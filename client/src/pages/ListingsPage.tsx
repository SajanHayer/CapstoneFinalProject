import React, { useState, useEffect } from "react";
import { ListingCard } from "../components/listings/ListingCard";
import { ListingRowCard } from "../components/listings/ListingRowCard";
import { Search, SlidersHorizontal } from "lucide-react";
import { Range } from "react-range";

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
  endsAt: string;
  bids: number;
}

export const ListingsPage: React.FC = () => {
  const [status, setStatus] = useState<ListingStatus>("ACTIVE");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"ending" | "price" | "bids">("ending");
  const [make, setMake] = useState<string>("all");

  const [yearRange, setYearRange] = useState<number>(2010);

  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  const [mileageRange, setMileageRange] = useState<number[]>([0, 200000]);

  const [endingSoon, setEndingSoon] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://localhost:8080/api/vehicles", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch listings");

        const data = await res.json();

        const mappedListings: Listing[] = data.vehicles.map((v: any) => ({
          id: v.id.toString(),
          title: `${v.year} ${v.make} ${v.model}`,
          thumbnailUrl: Array.isArray(v.image_url)
            ? v.image_url[0]
            : v.image_url,
          currentPrice: Number(v.price),
          location: v.location || "Unknown",
          mileage: Number(v.mileage_hours ?? 0),
          year: Number(v.year),
          status:
            v.status === "available"
              ? "ACTIVE"
              : v.status === "pending"
              ? "UPCOMING"
              : "EXPIRED",
          endsAt: v.end_time ?? new Date().toISOString(),
          bids: v.bids_count ?? 0,
        }));

        setListings(mappedListings);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const makes = Array.from(
    new Set(
      listings
        .map((l) => l.title.split(" ")[1])
        .filter(Boolean)
        .map((m) => m.toLowerCase())
    )
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
    .filter((l) => l.year >= yearRange)
    .filter((l) => l.mileage >= mileageRange[0] && l.mileage <= mileageRange[1])
    .filter((l) => l.currentPrice >= priceRange[0] && l.currentPrice <= priceRange[1])
    .filter((l) => {
      if (!endingSoon) return true;
      const hoursLeft =
        (new Date(l.endsAt).getTime() - Date.now()) / (1000 * 60 * 60);
      return hoursLeft <= 24;
    })
    .sort((a, b) => {
      if (sort === "price") return b.currentPrice - a.currentPrice;
      if (sort === "bids") return (b.bids ?? 0) - (a.bids ?? 0);
      return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
    });

  return (
    <section className="market-page">
      <header className="market-header">
        <div>
          <h1 className="market-title">Browse vehicles</h1>
          <p className="market-sub">
            Find vehicles from across Lets Ride Canada auctions and sales.
          </p>
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
            <div className="market-tab-label">
              {s === "EXPIRED" ? "Ended" : s[0] + s.slice(1).toLowerCase()}
            </div>
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
            <select
              className="select select-outline"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            >
              <option value="all">All</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Year: {yearRange}+</div>
            <input
              type="range"
              min="1990"
              max="2025"
              value={yearRange}
              onChange={(e) => setYearRange(Number(e.target.value))}
              style={{
                width: "100%",
                marginTop: "10px",
                accentColor: "#4f7cff",
                cursor: "pointer"
              }}
            />
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">
              Mileage: {mileageRange[0].toLocaleString()} – {mileageRange[1].toLocaleString()} km
            </div>

            <Range
              step={5000}
              min={0}
              max={200000}
              values={mileageRange}
              onChange={(values) => setMileageRange(values)}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "6px",
                    width: "100%",
                    background: "#555",
                    borderRadius: "4px",
                    position: "relative",
                    marginTop: "12px",
                  }}
                >
                  {children}
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "18px",
                    width: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#4f7cff",
                    border: "3px solid white",
                    boxShadow: "0 0 6px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                />
              )}
            />
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">
              Price: ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}
            </div>

            <Range
              step={1000}
              min={0}
              max={100000}
              values={priceRange}
              onChange={(values) => setPriceRange(values)}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "6px",
                    width: "100%",
                    background: "#555",
                    borderRadius: "4px",
                    position: "relative",
                    marginTop: "12px",
                  }}
                >
                  {children}
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "18px",
                    width: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#4f7cff",
                    border: "3px solid white",
                    boxShadow: "0 0 6px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                />
              )}
            />
          </div>

          <div className="sidebar-block">
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={endingSoon}
                onChange={(e) => setEndingSoon(e.target.checked)}
              />
              Ending within 24 hours
            </label>
          </div>

          <div className="sidebar-block">
            <div className="sidebar-label">Sort</div>
            <select
              className="select select-outline"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
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
              >
                List
              </button>
              <button
                className={view === "grid" ? "view-btn active" : "view-btn"}
                onClick={() => setView("grid")}
              >
                Grid
              </button>
            </div>
          </div>

          <div className="sidebar-block">
            <button
              className="select select-outline"
              onClick={() => {
                setMake("all");
                setYearRange(2010);
                setMileageRange([0, 200000]);
                setPriceRange([0, 100000]);
                setEndingSoon(false);
                setSort("ending");
              }}
            >
              Clear Filters
            </button>
          </div>

          <div className="sidebar-block alert-box">
            <div className="sidebar-label">Email Alerts</div>

            <div className="alert-preview">
              <div>Make: {make === "all" ? "Any" : make.toUpperCase()}</div>
              <div>Year: {yearRange}+</div>
              <div>
                Price: ${priceRange[0].toLocaleString()} – $
                {priceRange[1].toLocaleString()}
              </div>
              <div>
                Mileage: {mileageRange[0].toLocaleString()} –{" "}
                {mileageRange[1].toLocaleString()} km
              </div>
            </div>

            <button
              className="create-alert-btn"
              onClick={() =>
                alert(
                  "Email alert created! You'll be notified when vehicles match these filters."
                )
              }
            >
              🔔 Create Email Alert
            </button>
          </div>

          <div className="sidebar-hint">
            Tip: Use Guest mode to browse. Sign in to bid, watch, and sell.
          </div>
        </aside>

        <div className="market-results">
          <div className="market-results-top">
            <div className="results-count">
              {loading ? "Loading…" : `${visibleListings.length} results`}
            </div>
          </div>

          <div
  className={view === "grid" ? "listings-grid" : "listings-list"}
  style={{ minHeight: "500px" }}
>
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
                )
              )}
          </div>
        </div>
      </div>
    </section>
  );
};
