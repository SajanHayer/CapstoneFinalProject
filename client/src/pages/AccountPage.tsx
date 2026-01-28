import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

interface ListedVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  condition: string;
  status: string;
}

type TabType = "garage" | "listings";

// Call Vehicle listing to get info and display it here 

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("garage");

  // Placeholder data for user's garage (owned vehicles)
  const [garageVehicles] = useState<ListedVehicle[]>([
    {
      id: 1,
      make: "Honda",
      model: "Motorcycle",
      year: 2020,
      price: 5000,
      condition: "used",
      status: "available",
    },
    {
      id: 2,
      make: "Harley-Davidson",
      model: "Street Glide",
      year: 2019,
      price: 12000,
      condition: "used",
      status: "available",
    },
  ]);

  // Placeholder data for user's listed vehicles for auction
  const [listedVehicles] = useState<ListedVehicle[]>([
    {
      id: 3,
      make: "Honda",
      model: "Motorcycle",
      year: 2020,
      price: 5000,
      condition: "used",
      status: "available",
    },
  ]);

  return (
    <section className="account-page">
      <div className="account-container">
        {/* Left Side - Profile */}
        <div className="account-profile">
          <div className="profile-header">
            <div className="profile-avatar">
              <span>👤</span>
            </div>
            <div className="profile-info">
              <h1>Collector Name</h1>
              <p className="profile-role">Member</p>
            </div>
          </div>

          <div className="profile-details">
            <h3>Contact Information</h3>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user?.email || "user@example.com"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">January 2024</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Account Status:</span>
              <span className="detail-value active">Active</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate("/edit-profile")}
            className="edit-profile-btn"
          >
            Edit Profile
          </Button>
        </div>

        {/* Right Side - Content */}
        <div className="account-content">
          {/* Tabs */}
          <div className="tabs-header">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "garage" ? "active" : ""}`}
                onClick={() => setActiveTab("garage")}
              >
                Garage
              </button>
              <button
                className={`tab ${activeTab === "listings" ? "active" : ""}`}
                onClick={() => setActiveTab("listings")}
              >
                Listings
              </button>
            </div>
            <Button
              variant="primary"
              onClick={() =>
                activeTab === "garage"
                  ? navigate("/add-vehicle")
                  : navigate("/add-listing")
              }
              className="add-vehicle-btn"
            >
              + {activeTab === "garage" ? "Add Vehicle" : "Add Listing"}
            </Button>
          </div>

          <div className="vehicles-list">
            {(activeTab === "garage" ? garageVehicles : listedVehicles).length >
            0 ? (
              (activeTab === "garage" ? garageVehicles : listedVehicles).map(
                (vehicle) => (
                  <div key={vehicle.id} className="vehicle-item">
                    <div className="vehicle-info">
                      <h3>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <div className="vehicle-details">
                        <span className="price">
                          ${vehicle.price.toLocaleString()}
                        </span>
                        <span className="condition">{vehicle.condition}</span>
                        <span className={`status ${vehicle.status}`}>
                          {vehicle.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="no-vehicles">
                <p>
                  {activeTab === "garage"
                    ? "Your garage is empty."
                    : "You haven't listed any vehicles yet."}
                </p>
                <Button
                  variant="primary"
                  onClick={() =>
                    activeTab === "garage"
                      ? navigate("/add-vehicle")
                      : navigate("/add-listing")
                  }
                >
                  {activeTab === "garage"
                    ? "Add Your First Vehicle"
                    : "List Your First Vehicle"}
                </Button>
              </div>
            )}
          </div>

          <div className="account-menu">
            <h3>Account Settings</h3>
            <ul>
              <li>
                <a href="#settings">Settings</a>
              </li>
              <li>
                <a href="#security">Login &amp; Security</a>
              </li>
              <li>
                <a href="#information">Information</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
