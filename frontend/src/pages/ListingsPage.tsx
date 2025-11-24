import React, { useState } from "react";
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

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "2019 Ford Mustang GT Fastback",
    thumbnailUrl:
      "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg",
    currentPrice: 30600,
    location: "Calgary, AB",
    mileage: 75216,
    year: 2019,
    status: "ACTIVE",
    endsAt: "2025-12-01T18:00:00Z",
    bids: 37,
  },
  {
    id: "2",
    title: "2018 Toyota Tacoma TRD Off-Road",
    thumbnailUrl:
      "https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg",
    currentPrice: 41250,
    location: "Vancouver, BC",
    mileage: 89500,
    year: 2018,
    status: "UPCOMING",
    endsAt: "2025-12-10T18:00:00Z",
    bids: 0,
  },
  {
    id: "3",
    title: "2016 Subaru WRX STI",
    thumbnailUrl:
      "https://images.pexels.com/photos/919073/pexels-photo-919073.jpeg",
    currentPrice: 25500,
    location: "Toronto, ON",
    mileage: 120430,
    year: 2016,
    status: "EXPIRED",
    endsAt: "2025-10-10T18:00:00Z",
    bids: 19,
  },
];

export const ListingsPage: React.FC = () => {
  const [status, setStatus] = useState<ListingStatus>("ACTIVE");

  const visibleListings = MOCK_LISTINGS.filter(
    (l) => l.status === status
  );

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
        {visibleListings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
        {visibleListings.length === 0 && (
          <p>No listings in this category yet.</p>
        )}
      </div>
    </section>
  );
};
