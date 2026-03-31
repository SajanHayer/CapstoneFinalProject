import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ImageGallery } from "../components/vehicle/ImageGallery";
import { BidHistory } from "../components/listings/BidHistory";
import { socket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { formatTimeRemaining } from "../lib/timeUtils";
import "../styles/listingdetail.css";

type VechileInfo = {
  user_id: number;
  make: string;
  model: string;
  year: number;
  price: number | "";
  mileage_hours: number | "";
  condition: "new" | "used";
  status: "available" | "pending" | "sold";
  description: string | "";
  image_url: string[] | File[]; // array of image URLs or path to image or img
};

type BiddingInfo = {
  id: number;
  vehicle_id: number;
  seller_id: number;
  start_price: number;
  current_price: number;
  reserve_price: number;
  buy_now_price: number;
  status: string;
  type: string;
  location: string;
  views_count: number;
  start_time: string;
  end_time: string;
  created_at: string;
};

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<VechileInfo | null>(null);
  const [listing, setListing] = useState<BiddingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [currentHighestBid, setCurrentHighestBid] = useState<number>(0);
  const [highestBidderId, setHighestBidderId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("--:--:--");
  const [userLocation, setUserLocation] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's location on component mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        // Try to get city name from coordinates using reverse geocoding
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        )
          .then((res) => res.json())
          .then((data) => {
            // Extract city and state/province from the response
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const state = data.address?.state || "";
            if (city && state) {
              setUserLocation(`${city}, ${state}`);
            } else if (city) {
              setUserLocation(city);
            }
          })
          .catch((err) => console.log("Reverse geocoding failed:", err));
      },
      (error) => {
        console.log("Geolocation error:", error);
      },
    );
  }, []);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        // Fetch listing by listing ID
        const listingRes = await fetch(
          `http://localhost:8080/api/listings/${id}`,
        );
        const listingData = await listingRes.json();
        const fetchedListing = listingData.listing;

        if (!fetchedListing) {
          setError("Listing not found");
          setLoading(false);
          return;
        }

        setListing(fetchedListing);
        setCurrentHighestBid(Number(fetchedListing.current_price));

        // Fetch vehicle details using vehicle_id from listing
        const vehicleRes = await fetch(
          `http://localhost:8080/api/vehicles/${fetchedListing.vehicle_id}`,
        );
        const vehicleData = await vehicleRes.json();
        setVehicle(vehicleData.vehicle);

        // Fetch highest bidder info
        const bidsRes = await fetch(
          `http://localhost:8080/api/listings/${id}/all/bids`,
        );
        const bidsData = await bidsRes.json();
        if (bidsData.result && bidsData.result.length > 0) {
          // Find highest bid
          const highestBid = bidsData.result.reduce((max: any, bid: any) =>
            Number(bid.bid_amount) > Number(max.bid_amount) ? bid : max,
          );
          if (highestBid) {
            setHighestBidderId(highestBid.bidder_id);
          }
        }
      } catch (err) {
        const errorMsg = "Failed to load vehicle details";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]); // when id changes, refetch vehicle

  useEffect(() => {
    if (!user?.id || !id) return;

    const trackView = async () => {
      try {
        await fetch(
          "http://localhost:8080/api/recommendations/interactions/view",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ listingId: Number(id) }),
          },
        );
      } catch (error) {
        console.warn("[Recommendations] Failed to track listing view", error);
      }
    };

    void trackView();
  }, [id, user?.id]);

  useEffect(() => {
    if (!listing) return;
    // join room using LISTING ID, not vehicle ID
    socket.connect();
    socket.emit("join_auction", listing.id);
    return () => {
      socket.emit("leave_auction", listing.id);
      socket.disconnect();
    };
  }, [listing]);

  useEffect(() => {
    const handleBidUpdate = (data: {
      amount: number;
      bidder_id?: number;
      end_time?: string;
    }) => {
      setCurrentHighestBid(data.amount);
      if (data.bidder_id) setHighestBidderId(data.bidder_id);
      if (data.end_time) {
        // Update end_time if auction was extended
        setListing((prev) =>
          prev
            ? {
                ...prev,
                current_price: data.amount,
                end_time: data.end_time || prev.end_time,
              }
            : null,
        );
      } else {
        setListing((prev) =>
          prev ? { ...prev, current_price: data.amount } : null,
        );
      }
    };

    socket.on("bid_update", handleBidUpdate);

    return () => {
      socket.off("bid_update", handleBidUpdate);
    };
  }, []);

  useEffect(() => {
    if (!listing?.end_time) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(listing.end_time);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        return;
      }

      setTimeRemaining(formatTimeRemaining(diff));
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [listing?.end_time]);

  if (loading) {
    return (
      <section className="listing-detail-page">
        <div className="listing-detail-container">
          <p className="loading-text">Loading vehicle details...</p>
        </div>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="listing-detail-page">
        <div className="listing-detail-container">
          <Link to="/listings" className="back-link">
            ← Back to listings
          </Link>
          <p className="error-text">{error || "Vehicle not found"}</p>
        </div>
      </section>
    );
  }

  const handlePlaceBid = () => {
    if (!user?.is_verified) {
      toast.error("Please verify your account by adding a card before bidding");
      return;
    }

    if (!bidAmount || !userLocation) {
      toast.error("Please enter both a bid amount and your location");
      return;
    }

    if (!listing) {
      toast.error("Listing not loaded");
      return;
    }

    socket.emit("place_bid", {
      auctionId: listing.id,
      amount: bidAmount,
      userId: user?.id,
      location: userLocation,
    });

    setBidAmount(0);
  };

  // Determine listing status
  const getListingStatus = () => {
    if (!listing) return null;
    const now = new Date();
    const startTime = new Date(listing.start_time);
    const endTime = new Date(listing.end_time);

    if (now < startTime) return "UPCOMING";
    if (now >= startTime && now < endTime && listing.status === "active")
      return "ACTIVE";
    return "EXPIRED";
  };

  const listingStatus = getListingStatus();
  const isAuctionActive = listingStatus === "ACTIVE";
  const isAuctionUpcoming = listingStatus === "UPCOMING";

  // Grouped vehicle information
  const vehicleBasics = [
    { title: "Year", value: String(vehicle.year) },
    { title: "Make", value: vehicle.make },
    { title: "Model", value: vehicle.model },
  ];

  const vehicleSpecs = [
    {
      title: "Mileage Hours",
      value: vehicle.mileage_hours ? String(vehicle.mileage_hours) : "N/A",
    },
    {
      title: "Condition",
      value:
        vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1),
    },
    // {
    //   title: "Price",
    //   value: vehicle.price ? `$${Number(vehicle.price).toFixed(2)}` : "N/A",
    // },
    {
      title: "Status",
      value: vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1),
    },
  ];

  return (
    <section className="listing-detail-page">
      <div className="listing-detail-container">
        {/* Back Link */}
        <Link to="/listings" className="back-link">
          ← Back to listings
        </Link>

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
              <span
                className={`tag tag-status tag-status-${listing?.status || "active"}`}
              >
                {listing?.status &&
                  listing.status.charAt(0).toUpperCase() +
                    listing.status.slice(1)}
              </span>
              <span className="tag tag-location">📍 {listing?.location}</span>
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
                <h3>Vehicle Specifications</h3>
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

            {/* Description Card */}
            {vehicle.description && (
              <div className="description-card">
                <h3>Description</h3>
                <p>{vehicle.description}</p>
              </div>
            )}

            {/* Bid History - Show for all auctions */}
            <div className="description-card" style={{ marginTop: "24px" }}>
              <BidHistory listingId={id} />
            </div>
          </div>

          {/* Bidding Section - Right Side */}
          <aside className="listing-sidebar">
            <div className="bid-card">
              <h2>Auction Information</h2>

              {/* Time Remaining - Only show for ACTIVE auctions */}
              {isAuctionActive && (
                <div className="time-remaining">
                  <p className="time-label">Time Remaining</p>
                  <p className="time-value">{timeRemaining}</p>
                </div>
              )}

              {/* Price Information */}
              {listing && (
                <div className="pricing-section">
                  <div className="price-row">
                    <span className="price-label">Current Bid</span>
                    <span className="price-value current">
                      ${Number(listing.current_price || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">Reserve Price</span>
                    <span className="price-value">
                      ${Number(listing.reserve_price || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">Buy Now Price</span>
                    <span className="price-value">
                      ${Number(listing.buy_now_price || 0).toFixed(2)}
                    </span>
                  </div>
                  {/* <div className="price-row">
                    <span className="price-label">Views</span>
                    <span className="price-value">{listing.views_count}</span>
                  </div> */}
                </div>
              )}

              {/* Bid Input */}
              {isAuctionUpcoming && (
                <div className="bid-info-message">
                  This auction hasn't started yet. Check back when it goes live
                  to place bids!
                </div>
              )}
              {!isAuctionActive && !isAuctionUpcoming && (
                <div className="bid-info-message">This auction has ended.</div>
              )}
              {highestBidderId === user?.id && isAuctionActive && (
                <div
                  className="bid-info-message"
                  style={{ backgroundColor: "#e3f2fd", color: "#1565c0" }}
                >
                  ✓ You are the highest bidder!
                </div>
              )}
              <div className="bid-input-section">
                <label htmlFor="bid-amount">Place Your Bid</label>
                <input
                  id="bid-amount"
                  type="number"
                  value={bidAmount || ""}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  placeholder={`Minimum $${(Number(currentHighestBid) || 0).toLocaleString()}`}
                  className="bid-input"
                  disabled={!isAuctionActive}
                />
              </div>
              <div className="bid-input-section">
                <label htmlFor="user-location">Your Location</label>
                <input
                  id="user-location"
                  type="text"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="Enter your location (e.g., Calgary, AB)"
                  className="bid-input"
                  disabled={!isAuctionActive}
                />
              </div>

              {/* Place Bid Button */}
              <button
                onClick={handlePlaceBid}
                disabled={
                  bidAmount <= currentHighestBid ||
                  !isAuctionActive ||
                  !userLocation ||
                  !user?.is_verified
                }
                className="bid-button"
              >
                {!user?.is_verified && isAuctionActive
                  ? "Add Card to Bid"
                  : isAuctionUpcoming
                    ? "Auction Not Started"
                    : isAuctionActive
                      ? "Place a Bid"
                      : "Auction Ended"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
