import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";

export const LandingPage: React.FC = () => {
  return (
    <section className="landing">
      <div className="landing-hero">
        <h1>
          Welcome to <span className="accent">Power BIDZ</span>
        </h1>
        <p className="subtitle">
          Ignite your bid. Transparent, time-boxed vehicle auctions across
          Canada.
        </p>
        <div className="landing-actions">
            <Button>Join as a Buyer</Button>
          <Link to="/register">
            <Button variant="outline">Join as a Seller</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
