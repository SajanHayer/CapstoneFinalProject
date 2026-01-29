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

export const ListingsPage: React.FC = () => {
  const [status, setStatus] = useState<ListingStatus>("ACTIVE");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings from backend
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        // const res = await fetch("http://localhost:8080/api/vehicles", {
        //   credentials: "include",
        // });

        const res = await fetch("http://localhost:8080/api/listings", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch listings");

        const data = await res.json();
        // Map backend data to Listing type
        const mappedListings: Listing[] = data.listings.map((listing: any) => {
          const v = listing.vehicle;

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
            status:
              listing.status === "active"
                ? "ACTIVE"
                : listing.status === "pending"
                  ? "UPCOMING"
                  : "EXPIRED",
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

    fetchListings();
  }, []);

  // Filter listings based on selected tab
  const visibleListings = listings.filter((l) => l.status === status);

  return (
    <section className="listings-page">
      <header className="listings-header">
        <h1>Marketplace</h1>
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
        {loading && <p>Loading listings...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && visibleListings.length === 0 && (
          <p>No listings in this category yet.</p>
        )}
        {!loading &&
          !error &&
          visibleListings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    </section>
  );
};
