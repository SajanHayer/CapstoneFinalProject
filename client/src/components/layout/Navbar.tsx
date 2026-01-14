import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo-letsrcanada.png";
import { useAuth } from "../../context/AuthContext";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
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
        {isLoggedIn ? (
          <>
            <NavLink to="/listings" className="nav-link">
              Browse
            </NavLink>
            <NavLink to="/favourites" className="nav-link">
              Favourites
            </NavLink>
            <NavLink to="/account" className="nav-link">
              Account
            </NavLink>
            <NavLink to="/add-vehicle" className="nav-link">
              Add Vehicle
            </NavLink>
          </>
        ) : (
          <div>Not Logged In </div>
        )}
      </nav>

      <div className="navbar-right">
        {isLoggedIn ? (
          <button className="btn btn-primary" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
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
