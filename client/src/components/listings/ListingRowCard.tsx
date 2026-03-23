import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Gauge, Heart, MapPin, TimerReset } from "lucide-react";
import type { Listing } from "../../pages/ListingsPage";

export function ListingRowCard({ listing }: { listing: Listing }) {
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

  const statusBadgeClass = useMemo(() => {
    if (listing.status === "ACTIVE") return "listing-row-badge";
    if (listing.status === "UPCOMING") return "listing-row-badge listing-row-badge-upcoming";
    return "listing-row-badge listing-row-badge-ended";
  }, [listing.status]);

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
          src={listing.thumbnailUrl || "https://placehold.co/800x500?text=Vehicle"}
          alt={listing.title}
          className="listing-row-thumb"
        />
        <div className={statusBadgeClass}>{statusLabel}</div>
      </div>

      <div className="listing-row-main">
        <div className="listing-row-topline">
          <span className="listing-row-eyebrow">Premium marketplace</span>
          <span className="listing-row-bids">{listing.bids} bids</span>
        </div>

        <div className="listing-row-title">{listing.title}</div>

        <div className="listing-row-sub">
          <span className="row-pill">
            <Gauge size={14} />
            {listing.mileage.toLocaleString()} km
          </span>
          <span className="row-pill">
            <MapPin size={14} />
            {listing.location}
          </span>
          {(listing.status === "ACTIVE" || listing.status === "UPCOMING") && timeRemaining ? (
            <span className="row-pill row-pill-timer">
              <TimerReset size={14} />
              {timeRemaining}
            </span>
          ) : (
            <span className="row-pill">Auction closed</span>
          )}
        </div>
      </div>

      <div className="listing-row-right" onClick={(e) => e.stopPropagation()}>
        <div className="listing-row-price-label">Current bid</div>
        <div className="listing-row-price">${listing.currentPrice.toLocaleString()}</div>
        <div className="listing-row-actions">
          <button className="icon-btn" title="Watchlist preview" type="button">
            <Heart size={18} />
          </button>
          <button
            className="btn btn-primary listing-row-cta"
            onClick={() => navigate(`/listings/${listing.id}`)}
            type="button"
          >
            View listing
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}