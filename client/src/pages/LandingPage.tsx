import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { enterGuest } = useAuth();
  return (
    <section className="landing">
      <div className="landing-hero">
        <h1>
          Welcome to <span className="accent">Lets Ride Canada</span>
        </h1>
        <p className="subtitle">
          Ignite your bid. Transparent, time-boxed vehicle auctions across
          Canada.
        </p>
        <div className="landing-actions">
          <Link to="/register">
            <Button variant="outline">Join as a Buyer</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">Join as a Seller</Button>
          </Link>
          <button
            className="btn btn-outline"
            onClick={() => {
              enterGuest();
              navigate("/listings");
            }}
          >
            Continue as Guest
          </button>
        </div>

        <div
          style={{
            marginTop: "1.6rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.9rem",
          }}
        >
          <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>Transparent</div>
            <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>Clear bidding history</div>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              Every bid is time-stamped, auditable, and easy to review.
            </p>
          </div>
          <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>Fast</div>
            <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>Time-boxed auctions</div>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              Real-time updates so users always know where they stand.
            </p>
          </div>
          <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>Insightful</div>
            <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>Seller analytics</div>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              See bid activity, top listings, and marketplace momentum.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
