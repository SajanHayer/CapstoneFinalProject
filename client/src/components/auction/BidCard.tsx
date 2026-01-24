import React, { useState, useEffect } from "react";
import { Card } from "../common/Card";
import { socket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";

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

interface BidCardProps {
  auctionId?: string;
  minimumPrice: number;
  currentPrice?: number;
  reservePrice?: number;
  buyNowPrice?: number;
}

export const BidCard: React.FC<BidCardProps> = ({ 
  auctionId, 
  minimumPrice, 
  currentPrice = 0,
  reservePrice = 0,
  buyNowPrice = 0
}) => {
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [currentHighestBid, setCurrentHighestBid] = useState<number>(currentPrice || minimumPrice);
  const [listing, setListing] = useState<BiddingInfo | null>(null);
  const [buyNowPriceValue, setBuyNowPriceValue] = useState<number>(buyNowPrice);
  const [reservePriceValue, setReservePriceValue] = useState<number>(reservePrice);
  const [currentPriceValue, setCurrentPriceValue] = useState<number>(currentPrice);
  const [status, setStatus] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [viewsCount, setViewsCount] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/listings/${auctionId}`
        );
        const data = await res.json();
        setListing(data.listing);
        setBuyNowPriceValue(Number(data.listing.buy_now_price));
        setReservePriceValue(Number(data.listing.reserve_price));
        setCurrentPriceValue(Number(data.listing.current_price));
        setCurrentHighestBid(Number(data.listing.current_price));
        setStatus(data.listing.status);
        setLocation(data.listing.location);
        setStartTime(data.listing.start_time);
        setEndTime(data.listing.end_time);
        setViewsCount(data.listing.views_count);
      } catch (err) {
        console.error(err);
      }
    };
    fetchListingDetails();
  }, [auctionId]);

  useEffect(() => {
    const handleBidUpdate = (data: { amount: number }) => {
      setCurrentHighestBid(data.amount);
      setCurrentPriceValue(data.amount);
    };

    socket.on("bid_update", handleBidUpdate);

    return () => {
      socket.off("bid_update", handleBidUpdate);
    };
  }, []);

  const handlePlaceBid = () => {
    if (!bidAmount) return;

    socket.emit("place_bid", {
      auctionId: auctionId,
      amount: bidAmount,
      userId: user?.id,
    });
  };

  return (
    <Card className="bg-white sticky top-24 p-6">
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-neutral-800">Place Your Bid</h2>
        
        <div className="space-y-2 pb-4 border-b border-neutral-200">
          <div className="flex justify-between">
            <p className="text-xs text-neutral-600">Current Price</p>
            <p className="text-sm font-semibold text-neutral-800">
              ${(currentPriceValue || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-neutral-600">Reserve Price</p>
            <p className="text-sm font-semibold text-neutral-800">
              ${(reservePriceValue || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-neutral-600">Buy Now Price</p>
            <p className="text-sm font-semibold text-neutral-800">
              ${(buyNowPriceValue || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-600 mb-2">
            Bid amount
          </label>
          <input
            type="number"
            value={bidAmount || ""}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            placeholder={`Minimum $${(minimumPrice || 0).toLocaleString()}`}
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
  );
};
