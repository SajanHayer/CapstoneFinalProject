import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { ListingDashboard } from "../components/analytics/ListingDashboard";
import { YouWonModal } from "../components/analytics/YouWonModal";

interface GarageVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  condition: string;
  status: string;
  hasActiveListing?: boolean;
  listingStatus?: string;
  listingStartTime?: string;
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
  const [wonListingId, setWonListingId] = useState<number | null>(null);
  const [transactionBidIds, setTransactionBidIds] = useState<Set<number>>(
    new Set(),
  );

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

        // Fetch listings for each vehicle to determine listing status
        const garageWithListings: GarageVehicle[] = await Promise.all(
          rows.map(async (vehicle: any) => {
            let listingStatus = undefined;
            let listingStartTime = undefined;
            try {
              const listingsRes = await fetch(
                `http://localhost:8080/api/listings/vehicle/all/${vehicle.id}`,
                { credentials: "include" },
              );
              if (listingsRes.ok) {
                const listingsData = await listingsRes.json();
                const listings = Array.isArray(listingsData?.result)
                  ? listingsData.result
                  : [];
                // Find the most recent active listing, fallback to most recent overall
                const activeListing = listings.find(
                  (l: any) => l.status === "active",
                );
                const mostRecentListing = activeListing || listings.at(-1);
                if (mostRecentListing) {
                  listingStatus =
                    mostRecentListing.status.charAt(0).toUpperCase() +
                    mostRecentListing.status.slice(1);
                  listingStartTime = mostRecentListing.start_time;
                }
              }
            } catch (err) {
              // Silently fail for individual vehicle listings
            }

            return {
              id: vehicle.id,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              condition: vehicle.condition ?? "",
              status: vehicle.status ?? "",
              listingStatus,
              listingStartTime,
            };
          }),
        );

        if (isMounted) {
          setGarageVehicles(garageWithListings);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load vehicles");
          toast.error("Failed to load your vehicles");
        }
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
          `http://localhost:8080/api/listings/bids/user/all/${user.id}`,
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
          // Fetch transactions for each bid to determine "You Won" status
          await fetchTransactionsForBids(bids);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load bids");
          toast.error("Failed to load your bids");
        }
      }
    };

    fetchBids();

    return () => {
      isMounted = false;
    };
  }, [user?.id, activeTab]);

  const fetchTransactionsForBids = async (bids: BidItem[]) => {
    try {
      const bidIdsWithTransaction = new Set<number>();

      // For each ended listing, check if user has a transaction
      for (const bid of bids) {
        if (bid.listing.status === "sold" || bid.listing.status === "ended") {
          // Check if user has a transaction for this listing
          const transRes = await fetch(
            `http://localhost:8080/api/listings/transactions/check/${bid.listing_id}/${user?.id}`,
          );
          if (transRes.ok) {
            const transData = await transRes.json();
            if (transData.eligible) {
              bidIdsWithTransaction.add(bid.id);
            }
          }
        }
      }
      setTransactionBidIds(bidIdsWithTransaction);
    } catch (err) {
      toast.error("Failed to load transaction information");
    }
  };

  const handleBidItemClick = (bid: BidItem) => {
    // Only block cancelled listings - allow viewing of ended auctions
    if (bid.listing.status === "cancelled") {
      toast.info("This auction was cancelled by the seller.");
      return;
    }

    navigate(`/listings/${bid.listing_id}`);
  };

  const handleShowWinnerInfo = (listingId: number) => {
    setWonListingId(listingId);
  };

  const displayName = user?.email
    ? user.email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Collector";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="account-page">
      <div className="account-container">
        {/* Left Side - Profile */}
                <div className="account-profile account-profile-upgraded">
          <div className="account-profile-hero">
            <div className="profile-avatar profile-avatar-upgraded">
              <span>{initials}</span>
            </div>

            <div className="profile-info">
              <h1>{displayName}</h1>
              <p className="profile-role">
                {user?.role === "admin" ? "Administrator" : "Marketplace Member"}
              </p>
            </div>
          </div>

          <div className="account-mini-stats">
            <div className="account-mini-stat">
              <span className="account-mini-stat-label">Garage</span>
              <strong>{garageVehicles.length}</strong>
            </div>
            <div className="account-mini-stat">
              <span className="account-mini-stat-label">Bids</span>
              <strong>{userBids.length}</strong>
            </div>
          </div>

          <div className="profile-details">
            <h3>Account Overview</h3>

            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email || "user@example.com"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">
                {user?.role === "admin" ? "Administrator" : "Member"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Verification</span>
              <span className={`detail-badge ${user?.is_verified ? "verified" : "pending"}`}>
                {user?.is_verified ? "Verified" : "Pending"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-badge active">Active</span>
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
          <div className="tabs-header tabs-header-upgraded">
            <div>
              <h2 className="account-section-title">
                {activeTab === "garage" ? "Your Garage" : "Your Bids"}
              </h2>
              <p className="account-section-subtitle">
                {activeTab === "garage"
                  ? "Manage your vehicles and quickly check listing activity."
                  : "Track your auction activity, outcomes, and next actions."}
              </p>
            </div>

            <div className="tabs-actions">
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
          </div>

          {error && <p className="error-text">{error}</p>}

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
                        <span className="condition">{vehicle.condition}</span>
                        <span className={`status ${vehicle.status}`}>
                          {vehicle.status}
                        </span>
                        {vehicle.listingStatus &&
                          (() => {
                            const now = new Date();
                            const startTime = vehicle.listingStartTime
                              ? new Date(vehicle.listingStartTime)
                              : null;
                            const isUpcoming =
                              startTime &&
                              now < startTime &&
                              vehicle.listingStatus === "Active";

                            let bgColor = "#f97316";
                            if (vehicle.listingStatus === "Active") {
                              bgColor = isUpcoming ? "#8b5cf6" : "#3b82f6";
                            }

                            return (
                              <span
                                style={{
                                  backgroundColor: bgColor,
                                  color: "white",
                                  padding: "4px 12px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  marginLeft: "8px",
                                }}
                              >
                                Listing:{" "}
                                {isUpcoming
                                  ? "Upcoming"
                                  : vehicle.listingStatus}
                              </span>
                            );
                          })()}
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
            ) : // BIDS TAB
            userBids.length > 0 ? (
              userBids.map((bid) => {
                const now = new Date();
                const startTime = new Date(bid.listing.start_time);
                const endTime = new Date(bid.listing.end_time);
                const isLive =
                  now >= startTime &&
                  now < endTime &&
                  bid.listing.status === "active";
                const isEnded = bid.listing.status === "ended";
                const isSold = bid.listing.status === "sold";
                const thumbnailUrl =
                  bid.vehicle.image_url &&
                  Array.isArray(bid.vehicle.image_url) &&
                  bid.vehicle.image_url.length > 0
                    ? bid.vehicle.image_url[0]
                    : "https://via.placeholder.com/100x80?text=No+Image";

                return (
                  <div
                    key={bid.id}
                    className="vehicle-item"
                    onClick={() => handleBidItemClick(bid)}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      gap: "15px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Thumbnail Image */}
                    <div
                      style={{
                        minWidth: "120px",
                        height: "100px",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={thumbnailUrl}
                        alt={`${bid.vehicle.year} ${bid.vehicle.make} ${bid.vehicle.model}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <div className="vehicle-info" style={{ flex: 1 }}>
                      <h3>
                        {bid.vehicle.year} {bid.vehicle.make}{" "}
                        {bid.vehicle.model}
                      </h3>

                      <div className="vehicle-details">
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <div>
                            <span className="detail-label">Your Bid:</span>
                            <span
                              className="price"
                              style={{ display: "block" }}
                            >
                              ${bid.bid_amount.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="detail-label">Current:</span>
                            <span
                              className="price"
                              style={{ display: "block" }}
                            >
                              ${bid.listing.current_price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <span className="detail-text">
                          Start: ${bid.listing.start_price.toLocaleString()}
                        </span>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "8px",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          {/* Tag 1: Auction Status */}
                          {(() => {
                            let displayStatus = "Upcoming";
                            let statusClass = "upcoming";

                            if (bid.listing.status === "cancelled") {
                              displayStatus = "Cancelled";
                              statusClass = "cancelled";
                            } else if (isEnded) {
                              displayStatus = "Ended";
                              statusClass = "ended";
                            } else if (isLive) {
                              displayStatus = "Active";
                              statusClass = "active";
                            } else if (isSold) {
                              displayStatus = "Sold";
                              statusClass = "sold";
                            }

                            return (
                              <span
                                className={`listing-status-tag status-${statusClass}`}
                              >
                                {displayStatus}
                              </span>
                            );
                          })()}

                          {/* Tag 2: Bid Status - Changes based on seller actions or bid outcome */}
                          {(() => {
                            const isHighestBid =
                              bid.bid_amount === bid.listing.current_price;
                            const isSold = bid.listing.status === "sold";
                            const isCancelledListing =
                              bid.listing.status === "cancelled";
                            const isCancelledOrUnmet =
                              bid.listing.end_reason === "cancelled" ||
                              bid.listing.end_reason === "unmet";

                            // If listing was cancelled by seller
                            if (isCancelledListing) {
                              return (
                                <span className="listing-status-tag status-cancelled">
                                  Cancelled
                                </span>
                              );
                            }

                            // If seller marked as sold and user has transaction
                            if (isSold && transactionBidIds.has(bid.id)) {
                              return (
                                <span
                                  className="listing-status-tag"
                                  style={{
                                    backgroundColor: "#27ae60",
                                    color: "white",
                                  }}
                                >
                                  Sold
                                </span>
                              );
                            }

                            // If outbid
                            if (!isHighestBid && !isCancelledOrUnmet) {
                              return (
                                <span className="listing-status-tag status-outbid">
                                  Outbid
                                </span>
                              );
                            }

                            // If highest bid
                            if (isHighestBid && !isEnded) {
                              return (
                                <span className="listing-status-tag status-highest-bid">
                                  Highest Bid
                                </span>
                              );
                            }

                            return null;
                          })()}

                          {/* You Won Button - Only show if user has transaction */}
                          {(() => {
                            if (
                              transactionBidIds.has(bid.id) &&
                              bid.listing.status === "sold"
                            ) {
                              return (
                                <Button
                                  variant="primary"
                                  style={{
                                    fontSize: "12px",
                                    padding: "6px 12px",
                                    backgroundColor: "#27ae60",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowWinnerInfo(bid.listing.id);
                                  }}
                                >
                                  You Won
                                </Button>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <span
                          className="detail-text"
                          style={{
                            fontSize: "0.85em",
                            color: "var(--muted)",
                            marginTop: "6px",
                          }}
                        >
                          Bid placed on:{" "}
                          {new Date(bid.bid_time).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-vehicles">
                <p>You haven't placed any bids yet.</p>
                <Button variant="primary" onClick={() => navigate("/listings")}>
                  Browse Listings
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

      {/* You Won Modal */}
      {wonListingId !== null && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-wrapper">
            <YouWonModal
              listingId={wonListingId}
              onClose={() => {
                setWonListingId(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
