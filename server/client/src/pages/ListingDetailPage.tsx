import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { ImageGallery } from "../components/vehicle/ImageGallery";
import { BidCard } from "../components/auction/BidCard";
import { socket } from "../lib/socket";
import {
  ArrowLeft,
  BadgeCheck,
  Bike,
  Calendar,
  FileText,
  Gauge,
  Hash,
  Shield,
  Tag,
  Timer,
} from "lucide-react";

type VehicleInfo = {
  user_id: number;
  make: string;
  model: string;
  year: number;
  price: number | "";
  mileage_hours: number | "";
  condition: "new" | "used";
  status: "available" | "pending" | "sold";
  description: string | "";
  image_url: string[] | File[];
};

type TabKey = "overview" | "bids" | "notes" | "fees";

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/vehicles/${id}`);
        const data = await res.json();
        setVehicle(data.vehicle);
      } catch (err) {
        setError("Failed to load vehicle details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    socket.emit("join_auction", id);
    return () => {
      socket.emit("leave_auction", id);
    };
  }, [id]);

  const images = useMemo(() => {
    if (!vehicle?.image_url || !Array.isArray(vehicle.image_url)) return [];
    return vehicle.image_url.map((img) =>
      typeof img === "string" ? img : URL.createObjectURL(img),
    );
  }, [vehicle]);

  if (loading) {
    return (
      <section className="min-h-[70vh] pt-6">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-[color:var(--muted)]">Loading listing…</p>
        </div>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="min-h-[70vh] pt-6">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/listings" className="detail-back">
            <ArrowLeft size={16} /> Back to listings
          </Link>
          <p className="text-red-600 mt-3">{error || "Vehicle not found"}</p>
        </div>
      </section>
    );
  }

  const conditionLabel =
    vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1);
  const statusLabel = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1);

  return (
    <section className="detail-page">
      <div className="detail-shell">
        <div className="detail-topbar">
          <Link to="/listings" className="detail-back">
            <ArrowLeft size={16} /> Back to listings
          </Link>

          <div className="detail-topbar-actions">
            <button type="button" className="detail-ghost-btn" title="Watch listing">
              <BadgeCheck size={16} /> Watch
            </button>
            <button
              type="button"
              className="detail-ghost-btn"
              title="Share"
              onClick={() => {
                try {
                  navigator.clipboard.writeText(window.location.href);
                } catch {}
              }}
            >
              <Hash size={16} /> Copy link
            </button>
          </div>
        </div>

        <Card className="detail-hero">
          <div className="detail-hero-left">
            <p className="detail-hero-kicker">
              <Timer size={14} /> Live auction listing
            </p>

            <h1 className="detail-hero-title">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>

            <div className="detail-hero-badges">
              <span className="detail-badge">
                <Shield size={14} /> {conditionLabel}
              </span>
              <span className="detail-badge">
                <Tag size={14} /> {statusLabel}
              </span>
              <span className="detail-badge mono">VIN: TBD</span>
            </div>
          </div>

          <div className="detail-hero-right">
            <div className="detail-hero-price">
              <p>Starting</p>
              <h2>
                {vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "—"}
              </h2>
              <span>CAD</span>
            </div>
          </div>
        </Card>

        <div className="detail-grid">
          {/* LEFT */}
          <div className="detail-left">
            <ImageGallery images={images} title="Gallery" />

            <Card className="detail-card">
              <div className="detail-card-head">
                <p className="detail-card-title">Key details</p>
              </div>

              <div className="detail-specs">
                <div className="detail-spec">
                  <Calendar size={16} />
                  <div>
                    <p>Year</p>
                    <h4>{vehicle.year}</h4>
                  </div>
                </div>

                <div className="detail-spec">
                  <Bike size={16} />
                  <div>
                    <p>Make</p>
                    <h4>{vehicle.make}</h4>
                  </div>
                </div>

                <div className="detail-spec">
                  <FileText size={16} />
                  <div>
                    <p>Model</p>
                    <h4>{vehicle.model}</h4>
                  </div>
                </div>

                <div className="detail-spec">
                  <Gauge size={16} />
                  <div>
                    <p>Mileage / Hours</p>
                    <h4>{vehicle.mileage_hours ? vehicle.mileage_hours : "N/A"}</h4>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="detail-card">
              <div className="detail-tabs">
                <button
                  className={tab === "overview" ? "detail-tab detail-tab-active" : "detail-tab"}
                  onClick={() => setTab("overview")}
                  type="button"
                >
                  Overview
                </button>
                <button
                  className={tab === "bids" ? "detail-tab detail-tab-active" : "detail-tab"}
                  onClick={() => setTab("bids")}
                  type="button"
                >
                  Bid history
                </button>
                <button
                  className={tab === "notes" ? "detail-tab detail-tab-active" : "detail-tab"}
                  onClick={() => setTab("notes")}
                  type="button"
                >
                  Notes
                </button>
                <button
                  className={tab === "fees" ? "detail-tab detail-tab-active" : "detail-tab"}
                  onClick={() => setTab("fees")}
                  type="button"
                >
                  Shipping & fees
                </button>
              </div>

              {tab === "overview" && (
                <div className="detail-tabpanel">
                  <h3>Description</h3>
                  <p className="detail-muted">
                    {vehicle.description
                      ? vehicle.description
                      : "No description provided yet."}
                  </p>

                  <div className="detail-divider" />

                  <div className="detail-overview-grid">
                    <div className="detail-overview-item">
                      <p>Condition</p>
                      <h4>{conditionLabel}</h4>
                    </div>
                    <div className="detail-overview-item">
                      <p>Status</p>
                      <h4>{statusLabel}</h4>
                    </div>
                    <div className="detail-overview-item">
                      <p>Listing ID</p>
                      <h4 className="mono">{id}</h4>
                    </div>
                    <div className="detail-overview-item">
                      <p>VIN</p>
                      <h4 className="mono">TBD</h4>
                    </div>
                  </div>
                </div>
              )}

              {tab === "bids" && (
                <div className="detail-tabpanel">
                  <h3>Bid history</h3>
                  <p className="detail-muted">
                    Hook this up to your bids endpoint later — UI is ready.
                  </p>

                  <div className="detail-bidhistory">
                    {[
                      { who: "Bidder #248", amt: "$7,899", t: "Just now" },
                      { who: "Bidder #113", amt: "$7,750", t: "2m ago" },
                      { who: "Bidder #066", amt: "$7,500", t: "8m ago" },
                    ].map((b, i) => (
                      <div key={i} className="detail-bidrow">
                        <div className="detail-bidrow-left">
                          <span className="detail-bidder">{b.who}</span>
                          <span className="detail-bidtime">{b.t}</span>
                        </div>
                        <span className="detail-bidamt mono">{b.amt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "notes" && (
                <div className="detail-tabpanel">
                  <h3>Inspection / notes</h3>
                  <ul className="detail-list">
                    <li>✅ Clean listing layout for fast scanning</li>
                    <li>✅ High-contrast specs cards + gallery</li>
                    <li>✅ Sticky bid panel + live updates</li>
                    <li>🔧 Add seller notes + inspection report fields later</li>
                  </ul>
                </div>
              )}

              {tab === "fees" && (
                <div className="detail-tabpanel">
                  <h3>Shipping & fees</h3>
                  <p className="detail-muted">
                    Add your real fee rules later (buyer premium, taxes, delivery).
                  </p>

                  <div className="detail-feegrid">
                    <div className="detail-fee">
                      <p>Buyer premium</p>
                      <h4>5%</h4>
                    </div>
                    <div className="detail-fee">
                      <p>Estimated tax</p>
                      <h4>Varies</h4>
                    </div>
                    <div className="detail-fee">
                      <p>Pickup</p>
                      <h4>Local / arranged</h4>
                    </div>
                    <div className="detail-fee">
                      <p>Shipping</p>
                      <h4>Quote after win</h4>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT */}
          <div className="detail-right">
            <BidCard auctionId={id} minimumPrice={Number(vehicle.price) || 0} />
          </div>
        </div>
      </div>
    </section>
  );
};
