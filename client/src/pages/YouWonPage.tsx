import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

interface SellerInfo {
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

export const YouWonPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listingId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [listingDetails, setListingDetails] = useState<ListingDetails | null>(
    null,
  );

  useEffect(() => {
    if (!listingId || !user?.id) {
      setError("Missing required information");
      setLoading(false);
      return;
    }

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
        setListingDetails(listingData.listing);

        // Fetch seller info
        const sellerRes = await fetch(
          `http://localhost:8080/api/users/${listingData.listing.seller_id}`,
        );
        if (!sellerRes.ok) {
          throw new Error("Failed to fetch seller info");
        }
        const sellerData = await sellerRes.json();
        setSellerInfo({
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
  }, [listingId, user?.id]);

  if (loading) {
    return (
      <section style={{ padding: "40px 20px", textAlign: "center" }}>
        <p>Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ color: "#e74c3c" }}>Error: {error}</p>
        <Button onClick={() => navigate("/account")} variant="primary">
          Back to Account
        </Button>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: "40px 20px",
        backgroundColor: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Back Link */}
        <div
          onClick={() => navigate("/account")}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "40px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          ← Back to Account
        </div>

        {/* Main Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
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

          {/* Instructions */}
          <div
            style={{
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "32px",
              border: "1px solid #e0e0e0",
              textAlign: "left",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#333",
                marginTop: 0,
                marginBottom: "12px",
              }}
            >
              Next Steps
            </h3>
            <ol
              style={{
                paddingLeft: "20px",
                margin: 0,
                color: "#666",
                fontSize: "14px",
                lineHeight: "1.8",
              }}
            >
              <li>Contact the seller using the information below</li>
              <li>Arrange payment and delivery details</li>
              <li>Complete the transaction</li>
            </ol>
          </div>

          {/* Seller Contact Section */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "16px",
              }}
            >
              Seller Contact Information
            </h3>
            {sellerInfo && (
              <div
                style={{
                  backgroundColor: "#fafafa",
                  borderRadius: "8px",
                  padding: "24px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div style={{ marginBottom: "24px", textAlign: "left" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      display: "block",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Seller Name
                  </span>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#333",
                      margin: 0,
                    }}
                  >
                    {sellerInfo.name}
                  </p>
                </div>

                <div style={{ textAlign: "left" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      display: "block",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Email Address
                  </span>
                  <a
                    href={`mailto:${sellerInfo.email}`}
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#0066cc",
                      textDecoration: "none",
                      wordBreak: "break-all",
                      display: "block",
                    }}
                  >
                    {sellerInfo.email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <a
            href={sellerInfo ? `mailto:${sellerInfo.email}` : "#"}
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="primary"
              style={{
                width: "100%",
                backgroundColor: "#27ae60",
                marginBottom: "16px",
              }}
            >
              Send Email to Seller
            </Button>
          </a>

          <Button
            variant="primary"
            onClick={() => navigate("/account")}
            style={{
              width: "100%",
              backgroundColor: "#666",
            }}
          >
            Back to Account
          </Button>
        </div>
      </div>
    </section>
  );
};
