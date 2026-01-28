import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

interface GarageVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  condition: string;
  status: string;
}

interface ListedVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  start_price: number;
  reserve_price: number;
  buy_now_price?: number;
  current_price: number;
  start_time: string;
  end_time: string;
  statusListing: string;
  location: string;
}

type TabType = "garage" | "listings";

// Call Vehicle listing to get info and display it here

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("garage");
  const [error, setError] = useState<string | null>(null);
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);
  const [listedVehicles, setListedVehicles] = useState<ListedVehicle[]>([]);

  // Fetch garage vehicles and listings on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/vehicles/user/${user.id}`,
        );
        const data = await res.json();

        // Show all vehicles in garage, and separated listed vehicles for listings tab
        const garage: GarageVehicle[] = [];
        const listed: ListedVehicle[] = [];

        data.result.forEach((item: any) => {
          const vehicle = {
            id: item.vehicles.id,
            make: item.vehicles.make,
            model: item.vehicles.model,
            year: item.vehicles.year,
            price: Number(item.vehicles.price),
            condition: item.vehicles.condition,
            status: item.vehicles.status,
          };

          // All vehicles go to garage
          garage.push(vehicle);

          // If vehicle has a listing, also add to listings tab
          if (item.listings) {
            listed.push({
              id: item.listings.id,
              make: item.vehicles.make,
              model: item.vehicles.model,
              year: item.vehicles.year,
              start_price: Number(item.listings.start_price),
              reserve_price: Number(item.listings.reserve_price),
              buy_now_price: item.listings.buy_now_price
                ? Number(item.listings.buy_now_price)
                : undefined,
              current_price: Number(item.listings.current_price),
              start_time: item.listings.start_time,
              end_time: item.listings.end_time,
              statusListing: item.listings.status,
              location: item.listings.location,
            });
          }
        });

        setGarageVehicles(garage);
        setListedVehicles(listed);
      } catch (err) {
        setError("Failed to load vehicle details");
        console.error(err);
      }
    };

    fetchData();
  }, []);
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
              <span className="detail-value">
                {user?.email || "user@example.com"}
              </span>
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
                (item) => (
                  <div
                    key={item.id}
                    className="vehicle-item"
                    onClick={() => {
                      if (activeTab === "listings") {
                        navigate(`/listings/${item.id}`);
                      }
                    }}
                    style={{
                      cursor: activeTab === "listings" ? "pointer" : "default",
                    }}
                  >
                    <div className="vehicle-info">
                      {activeTab === "garage" ? (
                        <>
                          <h3>
                            {(item as GarageVehicle).year}{" "}
                            {(item as GarageVehicle).make}{" "}
                            {(item as GarageVehicle).model}
                          </h3>
                          <div className="vehicle-details">
                            <span className="price">
                              ${(item as GarageVehicle).price.toLocaleString()}
                            </span>
                            <span className="condition">
                              {(item as GarageVehicle).condition}
                            </span>
                            <span
                              className={`status ${(item as GarageVehicle).status}`}
                            >
                              {(item as GarageVehicle).status}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3>
                            {(item as ListedVehicle).year}{" "}
                            {(item as ListedVehicle).make}{" "}
                            {(item as ListedVehicle).model}
                          </h3>
                          <div className="vehicle-details">
                            <span className="price">
                              $
                              {(
                                item as ListedVehicle
                              ).current_price.toLocaleString()}
                            </span>
                            <span className="detail-text">
                              Start: $
                              {(
                                item as ListedVehicle
                              ).start_price.toLocaleString()}
                            </span>
                            <span className="detail-text">
                              Reserve: $
                              {(
                                item as ListedVehicle
                              ).reserve_price.toLocaleString()}
                            </span>
                            <span
                              className={`status ${(item as ListedVehicle).statusListing}`}
                            >
                              {(item as ListedVehicle).statusListing}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ),
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
