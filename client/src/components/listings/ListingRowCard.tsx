import React from "react";
import { useNavigate } from "react-router-dom";
import type { Listing } from "../../pages/ListingsPage";
import { Heart, ArrowRight, Gauge, MapPin } from "lucide-react";

export function ListingRowCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate();

  return (
    <article
      className="listing-row"
      onClick={() => navigate(`/listings/${listing.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/listings/${listing.id}`);
      }}
    >
      <div className="listing-row-media">
        <img
          src={listing.thumbnailUrl}
          alt={listing.title}
          className="listing-row-thumb"
        />
        <div className="listing-row-badge">
          {listing.status === "ACTIVE" ? "Active" : listing.status === "UPCOMING" ? "Upcoming" : "Ended"}
        </div>
      </div>

      <div className="listing-row-main">
        <div className="listing-row-title">{listing.title}</div>
        <div className="listing-row-sub">
          <span className="row-pill">
            <Gauge size={14} /> {listing.mileage.toLocaleString()} km
          </span>
          <span className="row-pill">
            <MapPin size={14} /> {listing.location}
          </span>
          <span className="row-pill">{listing.bids} bids</span>
        </div>
      </div>

      <div className="listing-row-right" onClick={(e) => e.stopPropagation()}>
        <div className="listing-row-price">${listing.currentPrice.toLocaleString()}</div>
        <div className="listing-row-actions">
          <button className="icon-btn" title="Watchlist">
            <Heart size={18} />
          </button>
          <button
            className="btn btn-primary listing-row-cta"
            onClick={() => navigate(`/listings/${listing.id}`)}
          >
            View <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
