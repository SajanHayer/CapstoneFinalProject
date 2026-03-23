import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Gauge, Heart, MapPin, TimerReset } from "lucide-react";
import type { Listing } from "../../pages/ListingsPage";

interface Props {
  listing: Listing;
}

export const ListingCard: React.FC<Props> = ({ listing }) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (listing.status === "EXPIRED") return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const target =
        listing.status === "UPCOMING"
          ? new Date(listing.startsAt)
          : new Date(listing.endsAt);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(listing.status === "UPCOMING" ? "Starting soon" : "00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [listing.endsAt, listing.startsAt, listing.status]);

  const statusLabel = useMemo(() => {
    if (listing.status === "ACTIVE") return "Live auction";
    if (listing.status === "UPCOMING") return "Upcoming";
    return "Ended";
  }, [listing.status]);

  const statusClass = useMemo(() => {
    if (listing.status === "ACTIVE") return "listing-badge-active";
    if (listing.status === "UPCOMING") return "listing-badge-upcoming";
    return "listing-badge-ended";
  }, [listing.status]);

  return (
    <article
      className="listing-card"
      onClick={() => navigate(`/listings/${listing.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/listings/${listing.id}`);
      }}
    >
      <div className="listing-card-media">
        <img
          src={listing.thumbnailUrl || "https://placehold.co/800x500?text=Vehicle"}
          alt={listing.title}
          className="listing-thumb"
        />
        <div className={`listing-card-badge ${statusClass}`}>{statusLabel}</div>
        <button
          className="listing-save-btn"
          onClick={(e) => e.stopPropagation()}
          type="button"
          title="Watchlist preview"
        >
          <Heart size={16} />
        </button>
      </div>

      <div className="listing-body">
        <div className="listing-card-topline">
          <span className="listing-eyebrow">Featured vehicle</span>
          <span className="listing-bid-count">{listing.bids} bids</span>
        </div>

        <h3>{listing.title}</h3>

        <div className="listing-meta-chips">
          <span className="listing-chip">
            <Gauge size={14} />
            {listing.mileage.toLocaleString()} km
          </span>
          <span className="listing-chip">
            <MapPin size={14} />
            {listing.location}
          </span>
        </div>

        <div className="listing-price-row">
          <div>
            <div className="listing-price-label">Current price</div>
            <p className="listing-price">${listing.currentPrice.toLocaleString()}</p>
          </div>

          {(listing.status === "ACTIVE" || listing.status === "UPCOMING") && timeRemaining ? (
            <div className="listing-timer-chip">
              <TimerReset size={14} />
              {timeRemaining}
            </div>
          ) : (
            <div className="listing-ended-chip">Auction closed</div>
          )}
        </div>

        <div className="listing-footer">
          <button
            className="listing-inline-link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/listings/${listing.id}`);
            }}
            type="button"
          >
            View listing
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
};