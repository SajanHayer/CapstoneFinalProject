import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Gauge, MapPin, TimerReset } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Listing } from "../../pages/ListingsPage";
import { formatTimeRemaining } from "../../lib/timeUtils";

export function ListingRowCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const isAdminView =
    location.pathname === "/admin/listings" && user?.role === "admin";

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
        setTimeRemaining(
          listing.status === "UPCOMING" ? "Starting soon" : "00:00:00",
        );
        return;
      }

      setTimeRemaining(formatTimeRemaining(diff));
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
    if (listing.status === "UPCOMING")
      return "listing-row-badge listing-row-badge-upcoming";
    return "listing-row-badge listing-row-badge-ended";
  }, [listing.status]);

  const handleRowClick = () => {
    if (isAdminView) {
      navigate(`/edit-listing/${listing.id}`);
      return;
    }

    navigate(`/listings/${listing.id}`);
  };

  const handleCancelListing = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this listing?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/listings/remove/${listing.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to cancel listing");
      }

      alert("Listing cancelled successfully");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel listing");
    }
  };

  const handleCompleteSale = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to complete this sale?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/listings/${listing.id}/sale`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to complete sale");
      }

      alert("Sale completed successfully");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to complete sale");
    }
  };

  return (
    <article
      className="listing-row"
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleRowClick();
      }}
    >
      <div className="listing-row-media">
        <img
          src={
            listing.thumbnailUrl || "https://placehold.co/800x500?text=Vehicle"
          }
          alt={listing.title}
          className="listing-row-thumb"
        />
        <div className={statusBadgeClass}>{statusLabel}</div>
      </div>

      <div className="listing-row-main">
        <div className="listing-row-topline">
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
          {(listing.status === "ACTIVE" || listing.status === "UPCOMING") &&
            timeRemaining ? (
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
        <div className="listing-row-price">
          ${listing.currentPrice.toLocaleString()}
        </div>

        <div
          className="listing-row-actions"
          style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
        >
          {isAdminView ? (
            <>
              <button
                className="btn btn-outline listing-row-cta"
                onClick={() => navigate(`/listings/${listing.id}`)}
                type="button"
              >
                View
              </button>

              <button
                className="btn btn-primary listing-row-cta"
                onClick={() => navigate(`/edit-listing/${listing.id}`)}
                type="button"
              >
                Edit
                <ArrowRight size={16} />
              </button>

              <button
                className="btn btn-outline listing-row-cta"
                onClick={() =>
                  navigate(`/seller/${user?.id}/analytics?listingId=${listing.id}`)
                }
                type="button"
              >
                Analytics
              </button>
              <button
                className="btn btn-outline listing-row-cta"
                onClick={handleCancelListing}
                type="button"
              >
                Cancel
              </button>

              <button
                className="btn btn-outline listing-row-cta"
                onClick={handleCompleteSale}
                type="button"
              >
                Complete Sale
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary listing-row-cta"
              onClick={() => navigate(`/listings/${listing.id}`)}
              type="button"
            >
              View listing
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}