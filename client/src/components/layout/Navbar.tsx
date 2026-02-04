import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo-letsrcanada.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isGuest, logout, exitGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const handleLogout = async () => {
    await logout();
    navigate("/"); // send user home
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
        <NavLink to="/analytics" className="nav-link">
          Analytics
        </NavLink>
        {/* <NavLink to="/favourites" className="nav-link">
          Favourites
        </NavLink> */}
        {isLoggedIn && (
          <>
            <NavLink to="/account" className="nav-link">
              Account
            </NavLink>
          </>
        )}
      </nav>

      <div className="navbar-right">
        <button
          className="btn btn-outline"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {isLoggedIn ? (
          <button className="btn btn-primary" onClick={handleLogout}>
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
