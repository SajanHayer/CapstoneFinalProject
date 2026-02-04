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
    </div>
  );
};
