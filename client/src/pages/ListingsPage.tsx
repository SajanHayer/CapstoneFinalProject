import React, { useState, useEffect } from "react";
import { ListingCard } from "../components/listings/ListingCard";
import { ListingFilters } from "../components/listings/ListingFilters";

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

const DEMO: Listing[] = [
  {
    id: "demo-1",
    title: "2021 Toyota Tacoma TRD Sport",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1c?auto=format&fit=crop&w=1400&q=80",
    currentPrice: 28500,
    location: "Calgary, AB",
    mileage: 68000,
    year: 2021,
    status: "ACTIVE",
    endsAt: new Date().toISOString(),
    bids: 12,
  },
  {
    id: "demo-2",
    title: "2019 BMW 330i xDrive",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1400&q=80",
    currentPrice: 21900,
    location: "Edmonton, AB",
    mileage: 91000,
    year: 2019,
    status: "UPCOMING",
    endsAt: new Date().toISOString(),
    bids: 0,
  },
  {
    id: "demo-3",
    title: "2017 Honda Civic Touring",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1400&q=80",
    currentPrice: 14900,
    location: "Vancouver, BC",
    mileage: 122000,
    year: 2017,
    status: "EXPIRED",
    endsAt: new Date().toISOString(),
    bids: 31,
  },
];

export const ListingsPage: React.FC = () => {
  const [status, setStatus] = useState<ListingStatus>("ACTIVE");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setDemoMode(false);

        const res = await fetch("http://localhost:8080/api/vehicles", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        const mapped: Listing[] = data.vehicles.map((v: any) => ({
          id: v.id.toString(),
          title: `${v.year} ${v.make} ${v.model}`,
          thumbnailUrl: Array.isArray(v.image_url) ? v.image_url[0] : v.image_url,
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

        setListings(mapped);
      } catch {
        // UI-only fallback so frontend work doesn't look “broken”
        setDemoMode(true);
        setListings(DEMO);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const visible = listings.filter((l) => l.status === status);

  return (
    <section className="listings-page">
      <header className="listings-header">
        <div>
          <h1>Marketplace</h1>
          {demoMode && (
            <p className="text-sm text-white/60 mt-1">
              Demo mode: backend unavailable — showing sample listings.
            </p>
          )}
        </div>

        <div className="pill-toggle">
          {(["UPCOMING", "ACTIVE", "EXPIRED"] as ListingStatus[]).map((s) => (
            <button
              key={s}
              className={s === status ? "pill pill-active" : "pill"}
              onClick={() => setStatus(s)}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </header>

      <ListingFilters />

      <div className="listings-grid">
        {loading && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="listing-card animate-pulse"
                style={{ minHeight: 290 }}
              />
            ))}
          </>
        )}

        {!loading && visible.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <p className="text-lg font-extrabold text-white/90">
              No listings in this category yet.
            </p>
            <p className="mt-2 text-sm text-white/65">
              Try a different tab or come back later.
            </p>
          </div>
        )}

        {!loading && visible.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    </section>
  );
};
