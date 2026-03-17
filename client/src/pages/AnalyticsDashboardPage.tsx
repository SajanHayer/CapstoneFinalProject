import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, Gavel, TrendingUp, Users, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BarMiniChart, Sparkline } from "../components/analytics/Charts";

type AnalyticsResponse = {
  scope: "seller" | "global";
  totals: {
    bidCount: number;
    uniqueBidders: number;
    totalBidVolume: number;
    avgBidAmount: number;
  };
  byListing: Array<{
    listingId: number;
    bidCount: number;
    uniqueBidders: number;
    maxBid: number;
    avgBid: number;
    lastBidTime: string | null;
  }>;
  recentBids: Array<{
    id: number;
    listingId: number;
    bidderId: number;
    bidAmount: number;
    bidTime: string;
    location: string | null;
  }>;
};

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

export const AnalyticsDashboardPage: React.FC = () => {
  const { isGuest, user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"maxBid" | "bidCount">("maxBid");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://localhost:8080/api/analytics/bids/summary", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = (await res.json()) as AnalyticsResponse;
        setData(json);
      } catch (e: any) {
        setError(e.message ?? "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Build a tiny activity series from recent bids (last 7 buckets)
  const activity = useMemo(() => {
    const bids = data?.recentBids ?? [];
    const buckets: { label: string; count: number; volume: number }[] = [];
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      buckets.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0, volume: 0 });

      for (const b of bids) {
        const bd = new Date(b.bidTime);
        const bkey = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`;
        if (bkey === key) {
          buckets[buckets.length - 1].count += 1;
          buckets[buckets.length - 1].volume += b.bidAmount;
        }
      }
    }
    return buckets;
  }, [data]);

  const sortedListings = useMemo(() => {
    const rows = [...(data?.byListing ?? [])];
    rows.sort((a, b) => {
      if (sort === "bidCount") return b.bidCount - a.bidCount;
      return b.maxBid - a.maxBid;
    });
    return rows.slice(0, 8);
  }, [data, sort]);

  return (
    <section className="px-1">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold" style={{ letterSpacing: "-0.02em" }}>
            Analytics
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {data?.scope === "seller"
              ? "Seller dashboard (scoped to your listings)."
              : "Marketplace snapshot (Guest/Demo view)."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            style={{
              padding: "0.35rem 0.7rem",
              border: "1px solid var(--border)",
              borderRadius: "999px",
              background: "var(--card2)",
              backdropFilter: "var(--backdrop)",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              {isLoggedIn && user?.email ? `Signed in: ${user.email}` : isGuest ? "Guest mode" : "Not signed in"}
            </span>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => setSort((s) => (s === "maxBid" ? "bidCount" : "maxBid"))}
            title="Toggle table sort"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
              <SlidersHorizontal size={16} /> Sort: {sort === "maxBid" ? "Max Bid" : "Bid Count"}
            </span>
          </button>
        </div>
      </div>

      {loading && <p className="mt-6">Loading analytics…</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!loading && !error && data && (
        <>
          {/* KPI cards + activity */}
          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-8 rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--card)", boxShadow: "var(--shadow)", backdropFilter: "var(--backdrop)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
                    Bid activity
                  </div>
                  <div style={{ fontWeight: 600 }}>Last 7 days</div>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{formatCurrency(activity.reduce((a, b) => a + b.volume, 0))} volume</div>
              </div>
              <div style={{ padding: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.9rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                    <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
                            bids
                          </div>
                          <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{data.totals.bidCount}</div>
                        </div>
                        <Gavel size={20} />
                      </div>
                      <div style={{ marginTop: "0.55rem" }}>
                        <Sparkline values={activity.map((a) => a.count)} />
                      </div>
                    </div>

                    <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
                            bid volume
                          </div>
                          <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatCurrency(data.totals.totalBidVolume)}</div>
                        </div>
                        <TrendingUp size={20} />
                      </div>
                      <div style={{ marginTop: "0.55rem" }}>
                        <Sparkline values={activity.map((a) => a.volume)} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.9rem" }}>
                    <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
                            unique bidders
                          </div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{data.totals.uniqueBidders}</div>
                        </div>
                        <Users size={20} />
                      </div>
                      <p style={{ margin: "0.55rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                        More unique bidders usually means higher competition (and better sell-through).
                      </p>
                    </div>

                    <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--card2)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
                            avg bid
                          </div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{formatCurrency(data.totals.avgBidAmount)}</div>
                        </div>
                        <DollarSign size={20} />
                      </div>
                      <p style={{ margin: "0.55rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                        Used as a pricing signal — compare it against reserve prices and starting bids.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--card)", boxShadow: "var(--shadow)", backdropFilter: "var(--backdrop)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
                    Top listings
                  </div>
                  <div style={{ fontWeight: 600 }}>{sort === "maxBid" ? "Highest max bids" : "Most bids"}</div>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Top 6</span>
              </div>
              <div style={{ padding: "1rem" }}>
                <BarMiniChart
                  labels={sortedListings.slice(0, 6).map((r) => `#${r.listingId}`)}
                  values={sortedListings.slice(0, 6).map((r) => (sort === "maxBid" ? r.maxBid : r.bidCount))}
                />
              </div>
            </div>
          </div>

          {/* Top listings table */}
          <div className="mt-6 rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--card)", boxShadow: "var(--shadow)", backdropFilter: "var(--backdrop)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-semibold">Listing leaderboard</h2>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Click a listing to open
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="opacity-70">
                  <tr>
                    <th className="text-left px-4 py-2">Listing</th>
                    <th className="text-left px-4 py-2">Bids</th>
                    <th className="text-left px-4 py-2">Bidders</th>
                    <th className="text-left px-4 py-2">Max bid</th>
                    <th className="text-left px-4 py-2">Avg bid</th>
                    <th className="text-left px-4 py-2">Last bid</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListings.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4" colSpan={6}>
                        No bid data yet.
                      </td>
                    </tr>
                  ) : (
                    sortedListings.map((r) => (
                      <tr
                        key={r.listingId}
                        className="border-t"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/listings/${r.listingId}`)}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--accent)" }}>
                          #{r.listingId}
                        </td>
                        <td className="px-4 py-3">{r.bidCount}</td>
                        <td className="px-4 py-3">{r.uniqueBidders}</td>
                        <td className="px-4 py-3">{formatCurrency(r.maxBid)}</td>
                        <td className="px-4 py-3">{formatCurrency(r.avgBid)}</td>
                        <td className="px-4 py-3">{formatDateTime(r.lastBidTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent bids */}
          <div className="mt-6 rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--card)", boxShadow: "var(--shadow)", backdropFilter: "var(--backdrop)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-semibold">Recent bids</h2>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Last 25
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="opacity-70">
                  <tr>
                    <th className="text-left px-4 py-2">Time</th>
                    <th className="text-left px-4 py-2">Listing</th>
                    <th className="text-left px-4 py-2">Bidder</th>
                    <th className="text-left px-4 py-2">Amount</th>
                    <th className="text-left px-4 py-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBids.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4" colSpan={5}>
                        No recent bids.
                      </td>
                    </tr>
                  ) : (
                    data.recentBids.map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className="px-4 py-3">{formatDateTime(b.bidTime)}</td>
                        <td className="px-4 py-3" style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => navigate(`/listings/${b.listingId}`)}>
                          #{b.listingId}
                        </td>
                        <td className="px-4 py-3">#{b.bidderId}</td>
                        <td className="px-4 py-3">{formatCurrency(b.bidAmount)}</td>
                        <td className="px-4 py-3">{b.location ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
