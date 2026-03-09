import React from "react";

export const ListingFilters: React.FC = () => {
  return (
    <div className="listing-filters">
      <input
        className="filter-search"
        placeholder="Search by make, model, or keyword..."
      />

      <div className="filter-row">
        <select className="filter-select">
          <option>All body types</option>
          <option>Cars & Trucks</option>
          <option>Motorcycles</option>
          <option>Boats</option>
        </select>

        <select className="filter-select">
          <option>All price ranges</option>
          <option>Under $10k</option>
          <option>$10k–$30k</option>
          <option>$30k+</option>
        </select>
      </div>

      {/* NEW FILTER ROW — Year + Mileage */}
      <div className="filter-row">
        <select className="filter-select">
          <option>Any year</option>
          <option>2020+</option>
          <option>2015+</option>
          <option>2010+</option>
          <option>2000+</option>
        </select>

        <select className="filter-select">
          <option>Any mileage</option>
          <option>Under 5,000 km</option>
          <option>Under 20,000 km</option>
          <option>Under 50,000 km</option>
          <option>Under 100,000 km</option>
        </select>
      </div>

      {/* NEW FILTER ROW — Condition + Auction Status */}
      <div className="filter-row">
        <select className="filter-select">
          <option>Any condition</option>
          <option>New</option>
          <option>Used</option>
        </select>

        <select className="filter-select">
          <option>Any auction status</option>
          <option>Ending soon</option>
          <option>No bids yet</option>
          <option>Popular (5+ bids)</option>
        </select>
      </div>

      {/* NEW FILTER ROW — Ending Soon Toggle */}
      <div className="filter-row">
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="checkbox" />
          Ending within 24 hours
        </label>
      </div>

    </div>
  );
};
