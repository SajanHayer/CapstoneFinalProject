import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { ListingDashboard } from "../components/analytics/ListingDashboard";

interface GarageVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  condition: string;
  status: string;
}

interface BidItem {
  id: number;
  bid_amount: number;
  bid_time: string;
  listing_id: number;
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
    image_url?: string[];
  };
  listing: {
    id: number;
    start_price: number;
    current_price: number;
    start_time: string;
    end_time: string;
    status: string;
    end_reason?: string;
  };
}

type TabType = "garage" | "bids";

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("garage");
  const [error, setError] = useState<string | null>(null);
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);
  const [userBids, setUserBids] = useState<BidItem[]>([]);
  const [dashboardListingId, setDashboardListingId] = useState<number | null>(
    null,
  );
  const [endedListingAlert, setEndedListingAlert] = useState<string | null>(null);

  // Fetch garage vehicles (only once on mount)
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const fetchGarage = async () => {
      try {
        setError(null);

        const res = await fetch(
          `http://localhost:8080/api/vehicles/user/${user.id}`,
        );

        if (!res.ok) {
          throw new Error(`Failed request: ${res.status}`);
        }

        const data = await res.json();
        const rows: any[] = Array.isArray(data?.result) ? data.result : [];

        const garage: GarageVehicle[] = rows.map((vehicle: any) => ({
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          condition: vehicle.condition ?? "",
          status: vehicle.status ?? "",
        }));

        if (isMounted) {
          setGarageVehicles(garage);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load vehicles");
        }
        console.error(err);
      }
    };

    fetchGarage();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Fetch user bids (only when bids tab is active)
  useEffect(() => {
    if (!user?.id || activeTab !== "bids") return;

    let isMounted = true;

    const fetchBids = async () => {
      try {
        setError(null);

        const res = await fetch(
          `http://localhost:8080/api/listings/bids/user/${user.id}`,
        );

        if (!res.ok) {
          throw new Error(`Failed request: ${res.status}`);
        }

        const data = await res.json();
        const result: any[] = Array.isArray(data?.result) ? data.result : [];

        const bids: BidItem[] = result
          .filter((item: any) => item.listing && item.vehicle)
          .map((item: any) => ({
            id: item.id,
            bid_amount: Number(item.bid_amount),
            bid_time: item.bid_time,
            listing_id: item.listing_id,
            vehicle: {
              id: item.vehicle.id,
              make: item.vehicle.make,
              model: item.vehicle.model,
              year: item.vehicle.year,
              image_url: item.vehicle.image_url,
            },
            listing: {
              id: item.listing.id,
              start_price: Number(item.listing.start_price),
              current_price: Number(item.listing.current_price),
              start_time: item.listing.start_time,
              end_time: item.listing.end_time,
              status: item.listing.status,
              end_reason: item.listing.end_reason,
            },
          }));

        if (isMounted) {
          setUserBids(bids);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load bids");
        }
        console.error(err);
      }
    };

    fetchBids();

    return () => {
      isMounted = false;
    };
  }, [user?.id, activeTab]);

  const handleBidItemClick = (bid: BidItem) => {
    // Only block cancelled listings - allow viewing of ended auctions
    if (bid.listing.status === "cancelled") {
      setEndedListingAlert(`This auction was cancelled by the seller.`);
      setTimeout(() => setEndedListingAlert(null), 3000);
      return;
    }
    
    navigate(`/listings/${bid.listing_id}`);
  };

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
                className={`tab ${activeTab === "bids" ? "active" : ""}`}
                onClick={() => setActiveTab("bids")}
              >
                Bids
              </button>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/add-vehicle")}
              className="add-vehicle-btn"
            >
              + Add Vehicle
            </Button>
          </div>

          {error && <p className="error-text">{error}</p>}
          {endedListingAlert && (
            <div style={{
              padding: "12px 16px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "6px",
              color: "#856404",
              marginBottom: "16px",
              fontSize: "14px"
            }}>
              ⚠️ {endedListingAlert}
            </div>
          )}

          <div className="vehicles-list">
            {activeTab === "garage" ? (
              // GARAGE TAB
              garageVehicles.length > 0 ? (
                garageVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="vehicle-item"
                    onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="vehicle-info">
                      <h3>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <div className="vehicle-details">
                        <span className="condition">
                          {vehicle.condition}
                        </span>
                        <span className={`status ${vehicle.status}`}>
                          {vehicle.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-vehicles">
                  <p>Your garage is empty.</p>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/add-vehicle")}
                  >
                    Add Your First Vehicle
                  </Button>
                </div>
              )
            ) : (
              // BIDS TAB
              userBids.length > 0 ? (
                userBids.map((bid) => {
                  const now = new Date();
                  const startTime = new Date(bid.listing.start_time);
                  const endTime = new Date(bid.listing.end_time);
                  const isLive = now >= startTime && now < endTime && bid.listing.status === "active";
                  const isEnded = bid.listing.status === "ended" || bid.listing.status === "sold";
                  const isCancelled = bid.listing.status === "cancelled";
                  const thumbnailUrl = bid.vehicle.image_url && Array.isArray(bid.vehicle.image_url) && bid.vehicle.image_url.length > 0
                    ? bid.vehicle.image_url[0]
                    : "https://via.placeholder.com/100x80?text=No+Image";

                  return (
                    <div
                      key={bid.id}
                      className="vehicle-item"
                      onClick={() => handleBidItemClick(bid)}
                      style={{ cursor: "pointer", display: "flex", gap: "15px", alignItems: "flex-start" }}
                    >
                      {/* Thumbnail Image */}
                      <div style={{ minWidth: "120px", height: "100px", borderRadius: "6px", overflow: "hidden" }}>
                        <img 
                          src={thumbnailUrl}
                          alt={`${bid.vehicle.year} ${bid.vehicle.make} ${bid.vehicle.model}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>

                      <div className="vehicle-info" style={{ flex: 1 }}>
                        <h3>
                          {bid.vehicle.year} {bid.vehicle.make}{" "}
                          {bid.vehicle.model}
                        </h3>

                        <div className="vehicle-details">
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                            <div>
                              <span className="detail-label">Your Bid:</span>
                              <span className="price" style={{ display: "block" }}>
                                ${bid.bid_amount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="detail-label">Current:</span>
                              <span className="price" style={{ display: "block" }}>
                                ${bid.listing.current_price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <span className="detail-text">
                            Start: ${bid.listing.start_price.toLocaleString()}
                          </span>

                          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                            {(() => {
                              const isHighestBid = bid.bid_amount === bid.listing.current_price;
                              const statusText = isHighestBid ? "Highest Bid" : "Outbid";
                              const statusClass = isHighestBid ? "highest-bid" : "outbid";
                              return (
                                <span className={`listing-status-tag status-${statusClass}`}>
                                  {statusText}
                                </span>
                              );
                            })()}
                            {(() => {
                              const displayStatus = isCancelled ? "Cancelled" : (isLive ? "Live" : (isEnded ? "Ended" : "Upcoming"));
                              const statusClass = isCancelled ? "cancelled" : (isLive ? "active" : (isEnded ? "ended" : "upcoming"));
                              return (
                                <span className={`listing-status-tag status-${statusClass}`}>
                                  {displayStatus}
                                </span>
                              );
                            })()}
                            {(() => {
                              if (bid.listing.end_reason === "cancelled") {
                                return (
                                  <span className="listing-status-tag status-cancelled">
                                    Seller Cancelled
                                  </span>
                                );
                              } else if (bid.listing.end_reason === "unmet") {
                                return (
                                  <span className="listing-status-tag status-unmet">
                                    Reserve Not Met
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          
                          <span className="detail-text" style={{ fontSize: "0.85em", color: "var(--muted)", marginTop: "6px" }}>
                            Bid placed on: {new Date(bid.bid_time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-vehicles">
                  <p>You haven't placed any bids yet.</p>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/listings")}
                  >
                    Browse Listings
                  </Button>
                </div>
              )
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

      {/* Dashboard Modal */}
      {dashboardListingId !== null && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-wrapper">
            <ListingDashboard
              listingId={dashboardListingId}
              onClose={() => {
                setDashboardListingId(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
