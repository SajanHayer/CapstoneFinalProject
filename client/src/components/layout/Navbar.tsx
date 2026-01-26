import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { enableGuest, disableGuest, isGuest } from "../../lib/guest";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Optional: if your app stores a user token somewhere, you can detect it here
  // For now: "logged in" is false unless you want to add a check.
  const isLoggedIn = false;

  const statusLabel = isLoggedIn
    ? "Logged In"
    : isGuest()
    ? "Guest Mode"
    : "Not Logged In";

  const goGuest = () => {
    enableGuest();
    navigate("/listings");
  };

  const exitGuest = () => {
    disableGuest();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-logo-btn" onClick={() => navigate("/")}>
          {/* If you don't have /logo.svg, replace with your real logo path or delete the img */}
          <img src="/logo.svg" alt="Logo" className="navbar-logo" />
          <span className="navbar-title">LET’S RIDE CANADA!</span>
        </button>
      </div>

      <nav className="navbar-links">
        <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
          Home
        </Link>
        <Link
          to="/listings"
          className={`nav-link ${isActive("/listings") ? "active" : ""}`}
        >
          Listings
        </Link>
      </nav>

      <div className="navbar-right">
        <span className="text-sm opacity-70 mr-2">{statusLabel}</span>

        {/* When not logged in and not guest */}
        {!isLoggedIn && !isGuest() && (
          <>
            <Link to="/login">
              <button className="btn btn-outline">Sign In</button>
            </Link>
            <Link to="/register">
              <button className="btn btn-primary">Join Now</button>
            </Link>
            <button className="btn btn-ghost" onClick={goGuest}>
              Guest
            </button>
          </>
        )}

        {/* Guest controls */}
        {isGuest() && !isLoggedIn && (
          <button className="btn btn-outline" onClick={exitGuest}>
            Exit Guest
          </button>
        )}
      </div>
    </header>
  );
};

