import React, { useEffect, useMemo, useState } from "react";
import { X, TrendingUp, Gavel, Users, DollarSign } from "lucide-react";
import { Button } from "../common/Button";
import "../../styles/dashboard.css";

type BidPoint = {
  amount: number;
  createdAt: string;
  bidderId: number;
  bidderName: string;
};

type ListingData = {
  id: number;
  title: string;
  year: number;
  make: string;
  model: string;
  location: string;
  status: string;
  start_time: string;
  end_time: string;
  start_price: number;
  current_price: number;
  reserve_price: number;
  buy_now_price: number;
};

type DashboardStats = {
  totalBids: number;
  highestBid: number;
  avgBid: number;
  uniqueBidders: number;
  avgIncrease: number;
  bidsPerHour: string;
};

type ListingDashboardProps = {
  listingId: number;
  onClose: () => void;
  listing?: ListingData;
  onStatusChange?: (newStatus: string) => void;
};

const LineChart: React.FC<{ bids: BidPoint[] }> = ({ bids }) => {
  const width = 800;
  const height = 250;
  const padding = 40;

  if (!bids || bids.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No bids yet</p>;
  }

  const sorted = [...bids].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const values = sorted.map((b) => b.amount);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const range = maxY - minY || 1;

  const stepX =
    sorted.length === 1 ? 0 : (width - padding * 2) / (sorted.length - 1);

  const getX = (i: number) => padding + i * stepX;
  const getY = (v: number) =>
    height - padding - ((v - minY) / range) * (height - padding * 2);

  const points = sorted
    .map((b, i) => `${getX(i)},${getY(b.amount)}`)
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      style={{ border: "1px solid var(--border)", borderRadius: "6px" }}
    >
      {/* Axes */}
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="var(--border)"
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="var(--border)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
      />

      {/* Dots */}
      {sorted.map((b, i) => (
        <circle
          key={i}
          cx={getX(i)}
          cy={getY(b.amount)}
          r={4}
          fill="var(--accent)"
        >
          <title>
            {b.bidderName} (ID: {b.bidderId})
            {"\n"}
            ${b.amount.toLocaleString()}
            {"\n"}
            {new Date(b.createdAt).toLocaleString()}
          </title>
        </circle>
      ))}
    </svg>
  );
};

export const ListingDashboard: React.FC<ListingDashboardProps> = ({
  listingId,
  onClose,
  listing,
  onStatusChange,
}) => {
  const [bids, setBids] = useState<BidPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch bids
        const bidsRes = await fetch(
          `http://localhost:8080/api/listings-analytics/${listingId}/bids`,
        );
        const bidsJson = await bidsRes.json();
        setBids(Array.isArray(bidsJson.result) ? bidsJson.result : []);

        // Check if listing is ended
        if (listing) {
          const now = new Date();
          const endTime = new Date(listing.end_time);
          setIsEnded(now > endTime);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [listingId, listing]);

  const stats = useMemo((): DashboardStats => {
    const sortedBids = [...bids].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const totalBids = sortedBids.length;
    const highestBid = totalBids > 0 ? Math.max(...sortedBids.map((b) => b.amount)) : 0;
    const avgBid = totalBids > 0 ? sortedBids.reduce((sum, b) => sum + b.amount, 0) / totalBids : 0;
    const uniqueBidders = new Set(sortedBids.map((b) => b.bidderId)).size;

    const firstBidTime = totalBids > 0 ? new Date(sortedBids[0].createdAt) : null;
    const lastBidTime =
      totalBids > 0 ? new Date(sortedBids[totalBids - 1].createdAt) : null;

    const timeSpanMinutes =
      firstBidTime && lastBidTime
        ? Math.round(
            (lastBidTime.getTime() - firstBidTime.getTime()) / 60000,
          )
        : 0;

    const deltas = sortedBids
      .map((b, i) => (i === 0 ? 0 : b.amount - sortedBids[i - 1].amount))
      .slice(1);

    const avgIncrease =
      deltas.length > 0
        ? Math.round(deltas.reduce((a, c) => a + c, 0) / deltas.length)
        : 0;

    const bidsPerHour =
      timeSpanMinutes > 0 ? (totalBids / (timeSpanMinutes / 60)).toFixed(2) : "—";

    return {
      totalBids,
      highestBid,
      avgBid,
      uniqueBidders,
      avgIncrease,
      bidsPerHour,
    };
  }, [bids]);

  const handleListingAction = async (action: "relist" | "sold" | "remove") => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/listings/remove/${listingId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Action failed");

      if (action === "sold") {
        onStatusChange?.("sold");
        setIsEnded(false);
      } else if (action === "relist") {
        onStatusChange?.("active");
        setIsEnded(false);
      } else if (action === "remove") {
        onClose();
      }
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to perform action. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="listing-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">
            {listing
              ? `${listing.year} ${listing.make} ${listing.model}`
              : "Listing Analytics"}
          </h2>
          <p className="dashboard-subtitle">
            Listing #{listingId} • {listing?.location}
          </p>
        </div>
        <button onClick={onClose} className="dashboard-close">
          <X size={24} />
        </button>
      </div>

      {loading ? (
        <p style={{ padding: "2rem", color: "var(--muted)" }}>
          Loading analytics…
        </p>
      ) : (
        <div className="dashboard-content">
          {/* Stats Grid */}
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Total Bids</div>
                  <div className="stat-value">{stats.totalBids}</div>
                </div>
                <Gavel size={20} />
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Highest Bid</div>
                  <div className="stat-value">
                    ${stats.highestBid.toLocaleString()}
                  </div>
                </div>
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Average Bid</div>
                  <div className="stat-value">
                    ${stats.avgBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <DollarSign size={20} />
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Unique Bidders</div>
                  <div className="stat-value">{stats.uniqueBidders}</div>
                </div>
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Listing Info */}
          {listing && (
            <div className="dashboard-listing-info">
              <div className="info-section">
                <h3>Pricing</h3>
                <div className="info-grid">
                  <div>
                    <span className="info-label">Starting Price</span>
                    <span className="info-value">
                      ${listing.start_price.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="info-label">Current Price</span>
                    <span className="info-value">
                      ${listing.current_price.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="info-label">Reserve Price</span>
                    <span className="info-value">
                      ${listing.reserve_price.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="info-label">Buy Now Price</span>
                    <span className="info-value">
                      ${listing.buy_now_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Bid Details</h3>
                <div className="info-grid">
                  <div>
                    <span className="info-label">Avg Increase</span>
                    <span className="info-value">
                      +${stats.avgIncrease.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="info-label">Bids Per Hour</span>
                    <span className="info-value">{stats.bidsPerHour}/hr</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bid History Chart */}
          {stats.totalBids > 0 && (
            <div className="dashboard-chart-section">
              <h3>Bid History</h3>
              <div className="chart-container">
                <LineChart bids={bids} />
              </div>
            </div>
          )}

          {/* Recent Bids Table */}
          {bids.length > 0 && (
            <div className="dashboard-bids-section">
              <h3>Recent Bids</h3>
              <div className="bids-table-container">
                <table className="bids-table">
                  <thead>
                    <tr>
                      <th>Bidder</th>
                      <th>Amount</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.slice(-10).map((bid, idx) => (
                      <tr key={idx}>
                        <td>{bid.bidderName}</td>
                        <td>${bid.amount.toLocaleString()}</td>
                        <td>{new Date(bid.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ended Listing Actions */}
          {isEnded && (
            <div className="dashboard-ended-actions">
              <h3>Auction Ended</h3>
              <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
                Choose what to do with this listing
              </p>
              <div className="ended-actions-grid">
                <Button
                  variant="primary"
                  onClick={() => handleListingAction("sold")}
                  disabled={actionLoading}
                >
                  Mark as Sold
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleListingAction("relist")}
                  disabled={actionLoading}
                >
                  Relist Auction
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleListingAction("remove")}
                  disabled={actionLoading}
                  style={{ borderColor: "var(--error)", color: "var(--error)" }}
                >
                  Remove Listing
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
