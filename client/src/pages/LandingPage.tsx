import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="landing">
      <div className="landing-hero">
        <h1>
          Welcome to <span className="accent">Power BIDZ</span>
        </h1>
        <p className="subtitle">
          A clean, time-boxed marketplace for vehicles — transparent bidding,
          real-time updates, and modern browsing built for Canada.
        </p>

        <div className="landing-actions">
          <Link to="/register">
            <Button>Join as a Buyer</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">Join as a Seller</Button>
          </Link>

          {/* Guest mode entry */}
          <Button variant="ghost" onClick={() => navigate("/listings")}>
            Continue as guest
          </Button>
        </div>
      </div>
    </section>
  );
};

