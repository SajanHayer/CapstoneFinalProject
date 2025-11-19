import React from "react";
import { useParams, Link } from "react-router-dom";

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <section className="listing-detail-page">
      <Link to="/listings" className="back-link">
        ← Back to listings
      </Link>
      <h1>Listing #{id}</h1>
      <p>
        This page will show full vehicle details, bidding history, and
        action buttons once we hook it to the backend.
      </p>
    </section>
  );
};
