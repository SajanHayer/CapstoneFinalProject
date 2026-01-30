import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ImageGallery } from "../components/vehicle/ImageGallery";
import { socket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
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
  const [timeRemaining, setTimeRemaining] = useState<string>("--:--:--");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        // const res = await fetch(`http://localhost:8080/api/vehicles/${id}`);
        const res = await fetch(
          `http://localhost:8080/api/listings/vehicle/${id}`,
        );
        const data = await res.json();
        setVehicle(data.result.vehicle);
        setListing(data.result);
        setCurrentHighestBid(Number(data.result.current_price));
      } catch (err) {
        setError("Failed to load vehicle details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]); // when id changes, refetch vehicle

  useEffect(() => {
    if (!id) return;
    // join room
    socket.emit("join_auction", id);
    return () => {
      socket.emit("leave_auction", id);
    };
  }, [id]);

  useEffect(() => {
    const handleBidUpdate = (data: { amount: number }) => {
      setCurrentHighestBid(data.amount);
      setListing((prev) =>
        prev ? { ...prev, current_price: data.amount } : null,
      );
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

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
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
    if (!bidAmount) return;

    socket.emit("place_bid", {
      auctionId: id,
      amount: bidAmount,
      userId: user?.id,
    });
  };

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
    {
      title: "Price",
      value: vehicle.price ? `$${Number(vehicle.price).toFixed(2)}` : "N/A",
    },
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
                {listing?.status.charAt(0).toUpperCase() +
                  listing?.status.slice(1)}
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
          </div>

          {/* Bidding Section - Right Side */}
          <aside className="listing-sidebar">
            <div className="bid-card">
              <h2>Auction Information</h2>

              {/* Time Remaining */}
              <div className="time-remaining">
                <p className="time-label">Time Remaining</p>
                <p className="time-value">{timeRemaining}</p>
              </div>

              {/* Price Information */}
              {listing && (
                <div className="pricing-section">
                  <div className="price-row">
                    <span className="price-label">Current Price</span>
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
              <div className="bid-input-section">
                <label htmlFor="bid-amount">Place Your Bid</label>
                <input
                  id="bid-amount"
                  type="number"
                  value={bidAmount || ""}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  placeholder={`Minimum $${(Number(vehicle.price) || 0).toLocaleString()}`}
                  className="bid-input"
                />
              </div>

              {/* Place Bid Button */}
              <button
                onClick={handlePlaceBid}
                disabled={bidAmount <= currentHighestBid}
                className="bid-button"
              >
                Place a Bid
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
