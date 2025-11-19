import React from "react";

export const FavouritesPage: React.FC = () => {
  return (
    <section className="favourites-page">
      <header className="favourites-header">
        <h1>My Favourites (5)</h1>
        <input
          className="filter-search"
          placeholder="Search your favourites..."
        />
      </header>
      <p>
        This will show favourite vehicles in cards, similar to the
        listings grid, once we connect it to real data.
      </p>
    </section>
  );
};
