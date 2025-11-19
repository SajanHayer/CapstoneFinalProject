import React from "react";
import { useNavigate } from "react-router-dom";
import type { Listing } from "../../pages/ListingsPage";

interface Props {
  listing: Listing;
}

export const ListingCard: React.FC<Props> = ({ listing }) => {
  const navigate = useNavigate();

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
        <p className="listing-bids">{listing.bids} bids</p>
      </div>
    </article>
  );
};
