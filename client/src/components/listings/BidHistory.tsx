import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { socket } from "../../lib/socket";

interface Bid {
  id: number;
  bidder_id: number;
  bid_amount: number;
  bid_time: string;
  location?: string;
}

interface BidHistoryProps {
  listingId: string | undefined;
}

export const BidHistory: React.FC<BidHistoryProps> = ({ listingId }) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) return;

    const fetchBids = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/listings/${listingId}/all/bids`,
        );
        const data = await res.json();
        const bidList: Bid[] = Array.isArray(data?.result) ? data.result : [];
        // Sort by bid_time descending (most recent first)
        bidList.sort(
          (a, b) =>
            new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime(),
        );
        setBids(bidList);
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load bid history");
        setLoading(false);
      }
    };

    fetchBids();
  }, [listingId]);

  // Listen for real-time bid updates
  useEffect(() => {
    if (!listingId) return;

    const handleNewBid = (newBid: Bid) => {
      setBids((prevBids) => {
        // Check if this bid already exists (avoid duplicates)
        const exists = prevBids.some((b) => b.id === newBid.id);
        if (exists) return prevBids;

        // Add new bid and re-sort
        const updated = [newBid, ...prevBids];
        return updated.sort(
          (a, b) =>
            new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime(),
        );
      });
    };

    // Listen for bid updates on this specific listing
    socket.on(`listing_${listingId}_bid`, handleNewBid);
    socket.on("bid_placed", handleNewBid);

    return () => {
      socket.off(`listing_${listingId}_bid`, handleNewBid);
      socket.off("bid_placed", handleNewBid);
    };
  }, [listingId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading bid history...
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
        No bids yet. Be the first to bid!
      </div>
    );
  }

  return (
    <div className="bid-history-section">
      <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>
        Bid History
      </h3>
      <div className="bid-history-table">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #e0e0e0",
                backgroundColor: "#f9f9f9",
              }}
            >
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Bid Amount
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Time
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Location
              </th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid, index) => (
              <tr
                key={bid.id}
                style={{
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: index === 0 ? "#f0f7ff" : "transparent",
                  transition: "background-color 0.3s ease",
                }}
              >
                <td
                  style={{
                    padding: "12px",
                    fontWeight: index === 0 ? "700" : "500",
                    color: index === 0 ? "#0066cc" : "#333",
                    fontSize: "16px",
                  }}
                >
                  $
                  {Number(bid.bid_amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {index === 0 && <span style={{ marginLeft: "8px" }}>👑</span>}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  {new Date(bid.bid_time).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  📍 {bid.location || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
