import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Listing } from "../../pages/ListingsPage";
import { Heart, ArrowRight, Gauge, MapPin } from "lucide-react";

export function ListingRowCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (listing.status === "EXPIRED") return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = listing.status === "UPCOMING" 
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
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [listing.endsAt, listing.startsAt, listing.status]);

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
        {listing.status === "ACTIVE" && (
          <div className="listing-row-badge">
            Active
          </div>
        )}
        {listing.status === "UPCOMING" && (
          <div className="listing-row-badge listing-row-badge-upcoming">
            Upcoming
          </div>
        )}
        {listing.status === "EXPIRED" && (
          <div className="listing-row-badge listing-row-badge-ended">
            Ended
          </div>
        )}
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
          <span className="row-pill">{(listing.status === "ACTIVE" || listing.status === "UPCOMING") && timeRemaining ? timeRemaining : `${listing.bids} bids`}</span>
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
