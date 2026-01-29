import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { VehicleHighlights } from "../components/vehicle/VehicleHighlight";
import { ImageGallery } from "../components/vehicle/ImageGallery";
import { socket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

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
        console.log(data.result);
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
      <section className="min-h-screen pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-neutral-600">Loading vehicle details...</p>
        </div>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="min-h-screen pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/listings"
            className="text-primary-600 hover:text-primary-700 font-semibold mb-4 inline-block"
          >
            ← Back to listings
          </Link>
          <p className="text-red-600">{error || "Vehicle not found"}</p>
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
    <section className="min-h-screen pt-20 pb-12 px-4 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <Link
          to="/listings"
          className="text-primary-600 hover:text-primary-700 font-semibold inline-block mb-6"
        >
          ← Back to listings
        </Link>

        <div className="flex gap-6">
          {/* Main Content - Left Side */}
          <div className="flex-1 space-y-6">
            <Card className="bg-gradient-to-r from-neutral-800 to-neutral-900 text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-300 text-sm">
                      {vehicle.condition.charAt(0).toUpperCase() +
                        vehicle.condition.slice(1)}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded text-sm font-mono text-neutral-100">
                      VIN: TBD
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Image Gallery */}
            {vehicle.image_url &&
              Array.isArray(vehicle.image_url) &&
              vehicle.image_url.length > 0 && (
                <ImageGallery
                  images={vehicle.image_url.map((img) =>
                    typeof img === "string" ? img : URL.createObjectURL(img),
                  )}
                  title="Gallery"
                />
              )}

            {/* Vehicle Basics Card */}
            <VehicleHighlights items={vehicleBasics} />

            {/* Vehicle Specs Card */}
            <VehicleHighlights items={vehicleSpecs} />

            {/* Description Card */}
            {vehicle.description && (
              <Card className="bg-white">
                <p className="text-sm text-neutral-600 font-semibold uppercase tracking-wide mb-3">
                  Description
                </p>
                <p className="text-neutral-800 leading-relaxed">
                  {vehicle.description}
                </p>
              </Card>
            )}
          </div>

          {/* Bidding Section - Right Side */}
          <div className="w-80">
            <Card className="bg-white sticky top-24 p-6">
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-neutral-800">
                  Place Your Bid
                </h2>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-600 mb-1">Time Remaining</p>
                  <p className="text-2xl font-mono font-bold text-red-700">
                    {timeRemaining}
                  </p>
                </div>

                {listing && (
                  <div className="space-y-2 pb-4 border-b border-neutral-200">
                    <div className="flex justify-between">
                      <p className="text-xs text-neutral-600">Current Price</p>
                      <p className="text-sm font-semibold text-neutral-800">
                        ${Number(listing.current_price || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-neutral-600">Reserve Price</p>
                      <p className="text-sm font-semibold text-neutral-800">
                        ${Number(listing.reserve_price || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-neutral-600">Buy Now Price</p>
                      <p className="text-sm font-semibold text-neutral-800">
                        ${Number(listing.buy_now_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-neutral-600 mb-2">
                    Bid amount
                  </label>
                  <input
                    type="number"
                    value={bidAmount || ""}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    placeholder={`Minimum $${(Number(vehicle.price) || 0).toLocaleString()}`}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={handlePlaceBid}
                  disabled={bidAmount <= currentHighestBid}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Place a bid
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
