import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { ListingDashboard } from "../components/analytics/ListingDashboard";
import { AlertCircle } from "lucide-react";

interface VehicleDetails {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage_hours: number;
  condition: string;
  status: string;
  description: string;
  image_url: string[];
}

interface ListingInfo {
  id: number;
  vehicleId: number;
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

export const VehicleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [listings, setListings] = useState<ListingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardListingId, setDashboardListingId] = useState<number | null>(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vehicle details
        const vehicleRes = await fetch(
          `http://localhost:8080/api/vehicles/${vehicleId}`
        );
        if (!vehicleRes.ok) {
          throw new Error("Failed to fetch vehicle details");
        }
        const vehicleData = await vehicleRes.json();
        setVehicle(vehicleData.vehicle);

        // Fetch all listings for this vehicle
        const listingsRes = await fetch(
          `http://localhost:8080/api/listings/vehicle-all/${vehicleId}`
        );
        if (!listingsRes.ok) {
          throw new Error("Failed to fetch listings");
        }
        const listingsData = await listingsRes.json();

        const mappedListings: ListingInfo[] = (listingsData.result || []).map((item: any) => ({
          id: item.id,
          vehicleId: item.vehicle_id,
          make: item.vehicle?.make || "",
          model: item.vehicle?.model || "",
          year: item.vehicle?.year || 0,
          start_price: Number(item.start_price),
          reserve_price: Number(item.reserve_price),
          buy_now_price: item.buy_now_price ? Number(item.buy_now_price) : undefined,
          current_price: Number(item.current_price),
          start_time: item.start_time,
          end_time: item.end_time,
          statusListing: item.status,
          location: item.location || "",
        }));

        setListings(mappedListings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicleId]);

  if (loading) {
    return (
      <section className="account-page">
        <div className="account-container">
          <p>Loading vehicle details...</p>
        </div>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="account-page">
        <div className="account-container">
          <p className="error-text">{error || "Vehicle not found"}</p>
          <Button variant="primary" onClick={() => navigate("/account")}>
            Back to Account
          </Button>
        </div>
      </section>
    );
  }

  const thumbnailUrl = vehicle.image_url && vehicle.image_url.length > 0
    ? vehicle.image_url[0]
    : "https://via.placeholder.com/300x200?text=No+Image";

  return (
    <section className="account-page">
      <div className="account-container">
        {/* Left Side - Vehicle Details */}
        <div className="account-profile">
          {/* Vehicle Image */}
          <div style={{ marginBottom: "20px", borderRadius: "8px", overflow: "hidden" }}>
            <img 
              src={thumbnailUrl} 
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              style={{ width: "100%", height: "300px", objectFit: "cover" }}
            />
          </div>

          <div className="profile-header">
            <div className="profile-avatar">
              <span>🏍️</span>
            </div>
            <div className="profile-info">
              <h1>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="profile-role">{vehicle.condition}</p>
            </div>
          </div>

          <div className="profile-details">
            <h3>Vehicle Information</h3>
            <div className="detail-item">
              <span className="detail-label">Price:</span>
              <span className="detail-value">${vehicle.price.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mileage/Hours:</span>
              <span className="detail-value">{vehicle.mileage_hours.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value ${vehicle.status}`}>
                {vehicle.status}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{vehicle.description}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <Button
              variant="primary"
              onClick={() => navigate(`/add-listing`)}
              className="edit-profile-btn"
            >
              + List Vehicle
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/account")}
              className="edit-profile-btn"
            >
              ← Back to Garage
            </Button>
          </div>
        </div>

        {/* Right Side - Listings */}
        <div className="account-content">
          {/* Header */}
          <div className="tabs-header">
            <h2>All Listings for This Vehicle</h2>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="vehicles-list">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <div key={listing.id} className="vehicle-item">
                  <div className="vehicle-info">
                    <h3>
                      {listing.year} {listing.make} {listing.model}
                    </h3>

                    <div className="vehicle-details">
                      <span className="price">
                        ${listing.current_price.toLocaleString()}
                      </span>
                      <span className="detail-text">
                        Start: ${listing.start_price.toLocaleString()}
                      </span>
                      <span className="detail-text">
                        Reserve: ${listing.reserve_price.toLocaleString()}
                      </span>
                      {(() => {
                        const startTime = new Date(listing.start_time);
                        const now = new Date();
                        const displayStatus =
                          startTime > now ? "Upcoming" : listing.statusListing;
                        const statusClass =
                          startTime > now
                            ? "upcoming"
                            : listing.statusListing.toLowerCase();
                        return (
                          <span
                            className={`listing-status-tag status-${statusClass}`}
                          >
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Analytics and Edit button */}
                    <div
                      style={{ marginTop: 10, display: "flex", gap: 10 }}
                    >
                      <Button
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDashboardListingId(listing.id);
                        }}
                      >
                        View Analytics
                      </Button>

                      {(() => {
                        const hasStarted =
                          new Date(listing.start_time) <= new Date();
                        const isEnded =
                          listing.statusListing === "ended" ||
                          listing.statusListing === "sold";
                        const cannotEdit = hasStarted || isEnded;

                        return (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Button
                              variant="outline"
                              disabled={cannotEdit}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!cannotEdit) {
                                  navigate(`/edit-listing/${listing.id}`);
                                }
                              }}
                              title={
                                cannotEdit
                                  ? "Cannot edit listing once it starts or ends"
                                  : "Edit auction details"
                              }
                            >
                              Edit Auction
                            </Button>
                            {cannotEdit && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                }}
                                title="Cannot edit listing once it starts or ends"
                              >
                                <AlertCircle
                                  size={18}
                                  style={{ color: "#dc2626" }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-vehicles">
                <p>No listings found for this vehicle.</p>
                <Button
                  variant="primary"
                  onClick={() => navigate("/account")}
                >
                  Back to Garage
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
