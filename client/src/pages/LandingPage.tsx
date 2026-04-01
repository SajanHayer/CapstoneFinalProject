import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { enterGuest, isLoggedIn } = useAuth();

  return (
    <section className="landing-next">
      <div className="landing-next-bg" />
      <div className="landing-next-glow landing-next-glow-one" />
      <div className="landing-next-glow landing-next-glow-two" />

      <div className="landing-next-shell">
        <div className="landing-next-hero">
          <div className="landing-next-copy">
            <div className="landing-next-pill">Modern vehicle marketplace</div>

            <h1 className="landing-next-title">
              Welcome to <span>Let&apos;s Ride Canada</span>
            </h1>

            <p className="landing-next-subtitle">
              Ignite your bid. Transparent, time-boxed vehicle auctions across
              Canada.
            </p>

            {!isLoggedIn ? (
              <div className="landing-next-actions">
                <Link to="/register">
                  <Button variant="primary">Join as a Buyer</Button>
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
                  type="button"
                >
                  Continue as Guest
                </button>
              </div>
            ) : (
              <div className="landing-next-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/listings")}
                  type="button"
                >
                  Browse Listings
                </button>

                <button
                  className="btn btn-outline"
                  onClick={() => navigate("/account")}
                  type="button"
                >
                  Go to Account
                </button>
              </div>
            )}
          </div>

          <div className="landing-next-visual">
            <div className="landing-next-panel">
              <div className="landing-next-panel-grid">
                <div className="landing-next-feature-card floating-soft">
                  <div className="landing-next-feature-label">Transparent</div>
                  <h3>Clear bidding history</h3>
                  <p>Every bid is time-stamped, visible, and easy to review.</p>
                </div>

                <div className="landing-next-feature-card floating-soft-delayed">
                  <div className="landing-next-feature-label">Fast</div>
                  <h3>Time-boxed auctions</h3>
                  <p>Real-time updates so users always know where they stand.</p>
                </div>

                <div className="landing-next-feature-card landing-next-feature-card-wide floating-soft">
                  <div className="landing-next-feature-label">Insightful</div>
                  <h3>Seller analytics</h3>
                  <p>
                    See bid activity, top listings, and marketplace momentum.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-next-bottom-strip">
          <div className="landing-next-mini-stat">
            <strong>Transparent</strong>
            <span>Bid visibility</span>
          </div>

          <div className="landing-next-mini-stat">
            <strong>Fast</strong>
            <span>Live marketplace flow</span>
          </div>

          <div className="landing-next-mini-stat">
            <strong>Clean</strong>
            <span>Better browsing experience</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;