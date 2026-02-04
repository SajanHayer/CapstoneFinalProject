import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../common/Card";
import { socket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock,
  Eye,
  MapPin,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";

interface BidCardProps {
  auctionId?: string;
  minimumPrice: number;
  currentPrice?: number;
  reservePrice?: number;
  buyNowPrice?: number;
}

function money(n: number) {
  return (n || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export const BidCard: React.FC<BidCardProps> = ({
  auctionId,
  minimumPrice,
  currentPrice = 0,
  reservePrice = 0,
  buyNowPrice = 0,
}) => {
  const { user } = useAuth();

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [currentHighestBid, setCurrentHighestBid] = useState<number>(
    currentPrice || minimumPrice,
  );
  const [buyNowPriceValue, setBuyNowPriceValue] = useState<number>(buyNowPrice);
  const [reservePriceValue, setReservePriceValue] = useState<number>(reservePrice);
  const [currentPriceValue, setCurrentPriceValue] = useState<number>(currentPrice);

  const [status, setStatus] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<string>("--:--:--");

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/listings/${auctionId}`);
        const data = await res.json();

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
        setFeedback("Couldn’t load bidding details.");
      }
    };

    if (auctionId) fetchListingDetails();
  }, [auctionId]);

  useEffect(() => {
    const handleBidUpdate = (data: { amount: number }) => {
      setCurrentHighestBid(data.amount);
      setCurrentPriceValue(data.amount);
      setFeedback("New bid received. Prices updated.");
      window.setTimeout(() => setFeedback(null), 2000);
    };

    socket.on("bid_update", handleBidUpdate);

    return () => {
      socket.off("bid_update", handleBidUpdate);
    };
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(endTime);
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
    const interval = window.setInterval(calculateTimeRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [endTime]);

  const bidIncrement = useMemo(() => {
    // simple, predictable increments that feel “auction-like”
    const base = currentHighestBid || minimumPrice || 0;
    if (base < 1000) return 25;
    if (base < 5000) return 50;
    if (base < 20000) return 100;
    return 250;
  }, [currentHighestBid, minimumPrice]);

  const minAllowed = useMemo(() => {
    const min = Math.max(minimumPrice || 0, currentHighestBid || 0);
    return min + bidIncrement;
  }, [minimumPrice, currentHighestBid, bidIncrement]);

  useEffect(() => {
    // auto-suggest a valid bid whenever prices load/update
    setBidAmount((prev) => (prev && prev >= minAllowed ? prev : minAllowed));
  }, [minAllowed]);

  const reserveMet = useMemo(() => {
    if (!reservePriceValue) return false;
    return (currentPriceValue || 0) >= reservePriceValue;
  }, [currentPriceValue, reservePriceValue]);

  const canBid = useMemo(() => {
    return Boolean(auctionId) && bidAmount >= minAllowed && timeRemaining !== "00:00:00";
  }, [auctionId, bidAmount, minAllowed, timeRemaining]);

  const handlePlaceBid = () => {
    setFeedback(null);

    if (!user?.id) {
      setFeedback("You need to be logged in to place a bid.");
      return;
    }

    if (!bidAmount || bidAmount < minAllowed) {
      setFeedback(`Bid must be at least ${money(minAllowed)} (increment ${money(bidIncrement)}).`);
      return;
    }

    socket.emit("place_bid", {
      auctionId,
      amount: bidAmount,
      userId: user.id,
    });

    setFeedback("Bid placed. Waiting for confirmation…");
    window.setTimeout(() => setFeedback(null), 2500);
  };

  const bump = (dir: 1 | -1) => {
    setBidAmount((v) => {
      const next = (v || minAllowed) + dir * bidIncrement;
      return Math.max(minAllowed, next);
    });
  };

  return (
    <Card className="detail-bidcard sticky top-24">
      <div className="detail-bidcard-top">
        <div>
          <p className="detail-bidcard-kicker">
            <Sparkles size={14} /> Live bidding
          </p>
          <h2 className="detail-bidcard-title">Place your bid</h2>
        </div>

        <div className="detail-pill">
          <Clock size={14} />
          <span className="mono">{timeRemaining}</span>
        </div>
      </div>

      <div className="detail-bidcard-metrics">
        <div className="detail-metric">
          <p>Current</p>
          <h3>{money(currentPriceValue || minimumPrice || 0)}</h3>
        </div>

        <div className="detail-metric">
          <p>Reserve</p>
          <h3>{reservePriceValue ? money(reservePriceValue) : "—"}</h3>
        </div>

        <div className="detail-metric">
          <p>Buy now</p>
          <h3>{buyNowPriceValue ? money(buyNowPriceValue) : "—"}</h3>
        </div>
      </div>

      <div className={reserveMet ? "detail-reserve detail-reserve-met" : "detail-reserve"}>
        {reservePriceValue ? (
          <>
            {reserveMet ? <BadgeCheck size={16} /> : <ArrowUpRight size={16} />}
            <span>
              {reserveMet ? "Reserve met" : "Reserve not met yet"}
              <span className="detail-reserve-sub">
                {" "}
                • min bid {money(minAllowed)} • incr {money(bidIncrement)}
              </span>
            </span>
          </>
        ) : (
          <span className="detail-reserve-sub">Min bid {money(minAllowed)} • incr {money(bidIncrement)}</span>
        )}
      </div>

      <div className="detail-bidcard-input">
        <label className="detail-label">Bid amount</label>

        <div className="detail-stepper">
          <button type="button" className="detail-stepper-btn" onClick={() => bump(-1)} aria-label="Decrease bid">
            <Minus size={16} />
          </button>

          <input
            type="number"
            value={bidAmount || ""}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            className="detail-stepper-input mono"
            placeholder={`Min ${money(minAllowed)}`}
          />

          <button type="button" className="detail-stepper-btn" onClick={() => bump(1)} aria-label="Increase bid">
            <Plus size={16} />
          </button>
        </div>

        <p className="detail-help">
          Tip: tap + / − for clean increments. Your bid updates live for everyone.
        </p>
      </div>

      {feedback && <div className="detail-feedback">{feedback}</div>}

      <button onClick={handlePlaceBid} disabled={!canBid} className="detail-primary-btn">
        Place bid
      </button>

      <div className="detail-bidcard-meta">
        <div className="detail-meta-row">
          <MapPin size={14} />
          <span>{location || "Location: —"}</span>
        </div>
        <div className="detail-meta-row">
          <Eye size={14} />
          <span>{viewsCount ? `${viewsCount} views` : "Views: —"}</span>
        </div>
        <div className="detail-meta-row">
          <BadgeCheck size={14} />
          <span>{status ? `Status: ${status}` : "Status: —"}</span>
        </div>
        <div className="detail-meta-row">
          <Clock size={14} />
          <span>{startTime ? `Started: ${new Date(startTime).toLocaleString()}` : "Started: —"}</span>
        </div>
        <div className="detail-meta-row">
          <Clock size={14} />
          <span>{endTime ? `Ends: ${new Date(endTime).toLocaleString()}` : "Ends: —"}</span>
        </div>
      </div>
    </Card>
  );
};
