import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      className="listing-card"
      onClick={() => navigate(`/listings/${listing.id}`)}
    >
      <img
        src={listing.thumbnailUrl}
        alt={listing.title}
        className="listing-thumb"
      />
      <div className="listing-body">
        <h3>{listing.title}</h3>
        <p className="listing-meta">
          {listing.year} • {listing.mileage.toLocaleString()} km •{" "}
          {listing.location}
        </p>
        <p className="listing-price">
          ${listing.currentPrice.toLocaleString()}
        </p>
        <div className="listing-footer">
          {(listing.status === "ACTIVE" || listing.status === "UPCOMING") && timeRemaining ? (
            <p className="listing-timer">{timeRemaining}</p>
          ) : (
            <p className="listing-bids">{listing.bids} bids</p>
          )}
        </div>
      </div>
    </article>
  );
};
