import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isGuest, logout, exitGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-logo-btn" onClick={() => navigate("/")}>
          <img src={logo} alt="Let's Ride Canada" className="navbar-logo" />
          <span className="navbar-title">Let's Ride Canada!</span>
        </button>
      </div>

      <nav className="navbar-links">
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>

        <NavLink to="/listings" className="nav-link">
          Browse
        </NavLink>

        {isLoggedIn && (
          <>
            <NavLink to="/heatmap" className="nav-link">
              Heat Map
            </NavLink>
            {!user?.is_verified && (
              <NavLink to="/add-card" className="nav-link">
                Add Card
              </NavLink>
            )}
            {/* <NavLink to="/favourites" className="nav-link">
              Favourites
            </NavLink> */}

            <NavLink to="/account" className="nav-link">
              Account
            </NavLink>

            {/* <NavLink to="/analytics" className="nav-link">
              Analytics
            </NavLink> */}
          </>
        )}
      </nav>

      <div className="navbar-right">
        <button
          className="btn btn-outline"
          onClick={toggleTheme}
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          type="button"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {isLoggedIn ? (
          <button
            className="btn btn-primary"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        ) : (
          <>
            {isGuest && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  exitGuest();
                  navigate("/");
                }}
                type="button"
              >
                Exit Guest
              </button>
            )}

            <Link to="/login" className="btn btn-outline">
              Sign In
            </Link>

            <Link to="/register" className="btn btn-primary">
              Join Now
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
