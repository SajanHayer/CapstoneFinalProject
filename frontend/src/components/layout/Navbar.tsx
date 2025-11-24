import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo-letsrcanada.png";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("fakeToken"); // temporary fake auth

  const handleLogout = () => {
    localStorage.removeItem("fakeToken");
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-logo-btn" onClick={() => navigate("/")}>
          <img src={logo} alt="Let's Ride Canada" className="navbar-logo" />
          <span className="navbar-title">Power BIDZ</span>
        </button>
      </div>

      <nav className="navbar-links">
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>
        <NavLink to="/listings" className="nav-link">
          Browse
        </NavLink>
        <NavLink to="/favourites" className="nav-link">
          Favourites
        </NavLink>
        <NavLink to="/account" className="nav-link">
          Account
        </NavLink>
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
