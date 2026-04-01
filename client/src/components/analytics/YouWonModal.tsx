import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "../common/Button";
import "../../styles/dashboard.css";

export interface YouWonModalProps {
  listingId: number;
  onClose: () => void;
}

interface SellerInfo {
  id: number;
  name: string;
  email: string;
}

interface ListingDetails {
  id: number;
  vehicle_id: number;
  start_price: number;
  current_price: number;
  seller_id: number;
}

export const YouWonModal: React.FC<YouWonModalProps> = ({
  listingId,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [listingDetails, setListingDetails] = useState<ListingDetails | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch listing details
        const listingRes = await fetch(
          `http://localhost:8080/api/listings/${listingId}`,
          { credentials: "include" },
        );
        if (!listingRes.ok) {
          throw new Error("Failed to fetch listing");
        }
        const listingData = await listingRes.json();
        setListingDetails(listingData.listing || listingData.result);

        // Fetch seller info
        const sellerRes = await fetch(
          `http://localhost:8080/api/auth/users/${listingData.listing?.seller_id || listingData.result?.seller_id}`,
        );
        if (!sellerRes.ok) {
          throw new Error("Failed to fetch seller info");
        }
        const sellerData = await sellerRes.json();
        setSellerInfo({
          id: sellerData.user.id,
          name: sellerData.user.name,
          email: sellerData.user.email,
        });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load information";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [listingId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          minHeight: "400px",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          minHeight: "400px",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <p style={{ color: "#e74c3c" }}>Error: {error}</p>
        <Button onClick={onClose} variant="primary">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        borderRadius: "12px",
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
        }}
        title="Close"
      >
        <X size={24} />
      </button>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#27ae60",
            marginBottom: "12px",
          }}
        >
          🎉 Congratulations!
        </h1>
        <p style={{ fontSize: "16px", color: "#666", margin: 0 }}>
          You have won this auction.
        </p>
      </div>

      {/* Amount Won */}
      {listingDetails && (
        <div
          style={{
            backgroundColor: "#f0f8f4",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "32px",
            border: "2px solid #27ae60",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            Winning Bid Amount
          </p>
          <p
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#27ae60",
              margin: 0,
            }}
          >
            ${listingDetails.current_price.toLocaleString()}
          </p>
        </div>
      )}

      {/* Seller Information */}
      {sellerInfo && (
        <>
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Seller Information
            </h2>
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    margin: "0 0 4px 0",
                  }}
                >
                  Name
                </p>
                <p style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                  {sellerInfo.name}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    margin: "0 0 4px 0",
                  }}
                >
                  Email
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    margin: 0,
                    wordBreak: "break-all",
                  }}
                >
                  {sellerInfo.email}
                </p>
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "#999",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            Contact the seller to arrange payment and pickup details. Thank you
            for using our platform!
          </p>
        </>
      )}

      {/* Action Button */}
      <Button
        onClick={onClose}
        variant="primary"
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
        }}
      >
        Got it
      </Button>
    </div>
  );
};
