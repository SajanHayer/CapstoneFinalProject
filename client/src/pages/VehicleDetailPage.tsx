import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "../components/common/Button";
import { ListingDashboard } from "../components/analytics/ListingDashboard";
import { ImageGallery } from "../components/vehicle/ImageGallery";

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
  vin?: string;
  style?: string;
  engine_size?: number;
  engine_size_unit?: string;
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
  end_reason?: string;
  highest_bid?: number;
  bid_count?: number;
}

export const VehicleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [listings, setListings] = useState<ListingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardListingId, setDashboardListingId] = useState<number | null>(
    null,
  );
  const [cancellingListingId, setCancellingListingId] = useState<number | null>(
    null,
  );
  const [sellingListingId, setSellingListingId] = useState<number | null>(null);

  // Check if vehicle has an active listing
  const hasActiveListing = listings.some(
    (listing) => listing.statusListing !== "cancelled",
  );

  const isVehicleSold = listings.some((listing) => listing.statusListing === "sold");

  useEffect(() => {
    if (!vehicleId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vehicle details
        const vehicleRes = await fetch(
          `http://localhost:8080/api/vehicles/${vehicleId}`,
        );
        if (!vehicleRes.ok) {
          throw new Error("Failed to fetch vehicle details");
        }
        const vehicleData = await vehicleRes.json();
        setVehicle(vehicleData.vehicle);

        // Fetch all listings for this vehicle
        const listingsRes = await fetch(
          `http://localhost:8080/api/listings/vehicle/all/${vehicleId}`,
        );
        let mappedListings: ListingInfo[] = [];
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          mappedListings = (listingsData.result || []).map((item: any) => ({
            id: item.id,
            vehicleId: item.vehicle_id,
            make: item.vehicle?.make || "",
            model: item.vehicle?.model || "",
            year: item.vehicle?.year || 0,
            start_price: Number(item.start_price),
            reserve_price: Number(item.reserve_price),
            buy_now_price: item.buy_now_price
              ? Number(item.buy_now_price)
              : undefined,
            current_price: Number(item.current_price),
            start_time: item.start_time,
            end_time: item.end_time,
            statusListing: item.status,
            location: item.location || "",
            end_reason: item.end_reason || "",
          }));
        }

        // Fetch highest bid for each listing
        const listingsWithBids = await Promise.all(
          mappedListings.map(async (listing) => {
            try {
              const bidsRes = await fetch(
                `http://localhost:8080/api/listings/${listing.id}/all/bids`,
              );
              if (bidsRes.ok) {
                const bidsData = await bidsRes.json();
                if (bidsData.result && bidsData.result.length > 0) {
                  const highestBid = bidsData.result.reduce(
                    (max: any, bid: any) =>
                      Number(bid.bid_amount) > Number(max.bid_amount)
                        ? bid
                        : max,
                  );
                  return {
                    ...listing,
                    highest_bid: Number(highestBid.bid_amount),
                    bid_count: bidsData.result.length,
                  };
                }
              }
            } catch (err) {
              // Silently fail for individual bid fetches
            }
            return { ...listing, bid_count: 0 };
          }),
        );

        setListings(listingsWithBids);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load data";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicleId]);

  const handleRemoveListing = async (listingId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this listing? This action cannot be undone.",
      )
    ) {
      return;
    }

    setCancellingListingId(listingId);
    try {
      const res = await fetch(
        `http://localhost:8080/api/listings/remove/${listingId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to remove listing");
      }

      // Update the listings state to reflect the change
      setListings((prevListings) =>
        prevListings.map((listing) =>
          listing.id === listingId
            ? { ...listing, statusListing: "cancelled" }
            : listing,
        ),
      );

      toast.success("Listing removed successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove listing",
      );
    } finally {
      setCancellingListingId(null);
    }
  };

  const handleSellVehicle = async (listingId: number) => {
    // Check if there are any bids
    const listing = listings.find((l) => l.id === listingId);
    if (!listing || !listing.bid_count || listing.bid_count === 0) {
      toast.error("You cannot sell a listing with no bids.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to mark this listing as sold? This action cannot be undone.",
      )
    ) {
      return;
    }

    setSellingListingId(listingId);
    try {
      const res = await fetch(
        `http://localhost:8080/api/listings/${listingId}/sale`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to complete sale");
      }

      // Update the listings state to show as sold
      setListings((prevListings) =>
        prevListings.map((listing) =>
          listing.id === listingId
            ? { ...listing, statusListing: "sold" }
            : listing,
        ),
      );

      toast.success("Sale completed successfully! Payment is pending.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete sale",
      );
    } finally {
      setSellingListingId(null);
    }
  };

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

  // Grouped vehicle information
  const vehicleBasics = [
    { title: "Year", value: String(vehicle.year) },
    { title: "Make", value: vehicle.make },
    { title: "Model", value: vehicle.model },
  ];

  const vehicleSpecs = [
    {
      title: "Mileage/Hours",
      value: vehicle.mileage_hours ? String(vehicle.mileage_hours) : "N/A",
    },
    {
      title: "Condition",
      value:
        vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1),
    },
    {
      title: "Price",
      value: vehicle.price
        ? `$${Number(vehicle.price).toLocaleString()}`
        : "N/A",
    },
    {
      title: "Status",
      value: vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1),
    },
    {
      title: "VIN",
      value: vehicle.vin || "N/A",
    },
    {
      title: "Style",
      value: vehicle.style || "N/A",
    },
    {
      title: "Engine Size",
      value:
        vehicle.engine_size && vehicle.engine_size_unit
          ? `${vehicle.engine_size} ${vehicle.engine_size_unit}`
          : "N/A",
    },
  ];

  return (
    <section className="listing-detail-page">
      <div className="listing-detail-container">
        {/* Back Link */}
        <div
          onClick={() => navigate("/account")}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "20px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          ← Back to Account
        </div>
        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
            marginBottom: "24px",
            flexWrap: "wrap",
            flexDirection: "column",
          }}
        >
          <div>
            <Button
              variant="primary"
              onClick={() => navigate(`/add-listing?vehicleId=${vehicle.id}`)}
              disabled={hasActiveListing}
              title={
                hasActiveListing
                  ? "Remove active listing to create a new one"
                  : ""
              }
            >
              + List Vehicle for Auction
            </Button>
            {hasActiveListing && !isVehicleSold && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "6px",
                  color: "#856404",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                This vehicle has an active listing. Remove it to relist the
                vehicle.
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (!isVehicleSold) {
                navigate(`/edit-vehicle/${vehicle.id}`);
              }
            }}
            disabled={isVehicleSold}
          >
            ✎ Edit Vehicle
          </Button>
          <Button variant="outline" onClick={() => navigate("/account")}>
            ← Back to Account
          </Button>
        </div>
        {/* Header Section */}
        <div className="listing-header-card">
          <div>
            <h1 className="listing-title">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <div className="listing-tags">
              <span className="tag tag-condition">
                {vehicle.condition.charAt(0).toUpperCase() +
                  vehicle.condition.slice(1)}
              </span>
              <span className={`tag tag-status tag-status-${vehicle.status}`}>
                {vehicle.status &&
                  vehicle.status.charAt(0).toUpperCase() +
                    vehicle.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="listing-content-grid">
          {/* Main Content - Left Side */}
          <div className="listing-main">
            {/* Image Gallery */}
            {vehicle.image_url &&
              Array.isArray(vehicle.image_url) &&
              vehicle.image_url.length > 0 && (
                <div className="gallery-section">
                  <ImageGallery
                    images={vehicle.image_url.map((img) =>
                      typeof img === "string" ? img : URL.createObjectURL(img),
                    )}
                    title="Gallery"
                  />
                </div>
              )}

            {/* Vehicle Details */}
            <div className="details-grid">
              <div className="details-card">
                <h3>Basic Information</h3>
                <div className="detail-rows">
                  {vehicleBasics.map((item, idx) => (
                    <div key={idx} className="detail-row">
                      <span className="detail-label">{item.title}</span>
                      <span className="detail-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="details-card">
                <h3>Specifications</h3>
                <div className="detail-rows">
                  {vehicleSpecs.map((item, idx) => (
                    <div key={idx} className="detail-row">
                      <span className="detail-label">{item.title}</span>
                      <span className="detail-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="details-card">
              <h3>Description</h3>
              <p style={{ lineHeight: "1.6", color: "#666" }}>
                {vehicle.description}
              </p>
            </div>
          </div>

          {/* Right Side - Listings */}
          <div className="listing-sidebar">
            <div className="sidebar-card">
              <h3>Auction History</h3>
              {error && (
                <p className="error-text" style={{ fontSize: "14px" }}>
                  {error}
                </p>
              )}

              {listings.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      style={{
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#333",
                          }}
                        >
                          Current Highest Bid: $
                          {listing.current_price.toLocaleString()}
                        </span>
                        {(() => {
                          const startTime = new Date(listing.start_time);
                          const now = new Date();
                          const displayStatus =
                            startTime > now
                              ? "Upcoming"
                              : listing.statusListing;
                          const statusClass =
                            startTime > now
                              ? "upcoming"
                              : listing.statusListing.toLowerCase();
                          return (
                            <span
                              className={`listing-status-tag status-${statusClass}`}
                              style={{ fontSize: "12px", padding: "4px 8px" }}
                            >
                              {displayStatus}
                            </span>
                          );
                        })()}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <span style={{ display: "block", color: "#999" }}>
                            Start
                          </span>
                          <span style={{ fontWeight: 500 }}>
                            ${listing.start_price.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span style={{ display: "block", color: "#999" }}>
                            Reserve
                          </span>
                          <span style={{ fontWeight: 500 }}>
                            ${listing.reserve_price.toLocaleString()}
                          </span>
                        </div>
                        {/* <div style={{ gridColumn: "1 / -1" }}>
                          <span style={{ display: "block", color: "#999" }}>
                            Highest Bid
                          </span>
                          <span style={{ fontWeight: 500 }}>
                            {listing.current_price ? `$${listing.current_price.toLocaleString()}` : "No bids"}
                          </span>
                        </div> */}
                      </div>

                      {/* Analytics and Edit button */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          variant="primary"
                          style={{
                            flex: 1,
                            fontSize: "12px",
                            padding: "6px 10px",
                          }}
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
                          const cannotEdit = hasStarted || isEnded || isVehicleSold;

                          return (
                            <Button
                              variant="outline"
                              style={{
                                flex: 1,
                                fontSize: "12px",
                                padding: "6px 10px",
                              }}
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
                          );
                        })()}
                      </div>

                      {/* Action Buttons for Ended Auctions */}
                      {(() => {
                        const isEnded = listing.statusListing === "ended";
                        const isSold = listing.statusListing === "sold";
                        const isCancelled =
                          listing.end_reason === "cancelled" ||
                          listing.statusListing === "cancelled";

                        if (isSold) {
                          return (
                            <div
                              style={{
                                marginTop: "10px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                borderTop: "1px solid #e0e0e0",
                                color: "#27ae60",
                                fontWeight: 600,
                                fontSize: "14px",
                              }}
                            >
                              ✓ Sold
                            </div>
                          );
                        }

                        if (isCancelled) {
                          return null;
                        }

                        return (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginTop: "10px",
                              paddingTop: "10px",
                              borderTop: "1px solid #e0e0e0",
                            }}
                          >
                            {isEnded && (
                              <Button
                                variant="primary"
                                style={{
                                  flex: 1,
                                  fontSize: "12px",
                                  padding: "6px 10px",
                                  backgroundColor: "#27ae60",
                                }}
                                disabled={
                                  sellingListingId === listing.id ||
                                  !listing.bid_count
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSellVehicle(listing.id);
                                }}
                                title={
                                  !listing.bid_count
                                    ? "Cannot sell with no bids"
                                    : "Mark listing as sold"
                                }
                              >
                                {sellingListingId === listing.id
                                  ? "Processing..."
                                  : "💰 Sell Vehicle"}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              style={{
                                flex: 1,
                                fontSize: "12px",
                                padding: "6px 10px",
                                color: "#dc2626",
                                borderColor: "#dc2626",
                              }}
                              disabled={cancellingListingId === listing.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveListing(listing.id);
                              }}
                            >
                              {cancellingListingId === listing.id
                                ? "Removing..."
                                : "🗑️ Remove Listing"}
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "#666" }}>
                  No auctions yet for this vehicle.
                </p>
              )}
            </div>
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
