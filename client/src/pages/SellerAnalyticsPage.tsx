import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/common/Button";

/* ---------------- Types ---------------- */
type BidPoint = {
    amount: number;
    createdAt: string;
    bidderId: number;
    bidderName: string;
};



/* ---------------- Line Chart ---------------- */
const LineChart: React.FC<{ bids: BidPoint[] }> = ({ bids }) => {
    const width = 800;
    const height = 300;
    const padding = 40;

    if (!bids || bids.length === 0) {
        return <p>No bids yet — graph will appear once bidding starts.</p>;
    }

    const sorted = [...bids].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
        <svg width={width} height={height} style={{ border: "1px solid #ddd" }}>
            {/* Axes */}
            <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={height - padding}
                stroke="black"
            />
            <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={height - padding}
                stroke="black"
            />

            {/* Line */}
            <polyline points={points} fill="none" stroke="black" strokeWidth={2} />

            {/* Dots (with hover tooltip) */}
            {sorted.map((b, i) => (
                <circle
                    key={i}
                    cx={getX(i)}
                    cy={getY(b.amount)}
                    r={4}
                    fill="black"
                >
                    <title>
                        {b.bidderName} (ID: {b.bidderId}){"\n"}
                        ${b.amount.toLocaleString()}{"\n"}
                        {new Date(b.createdAt).toLocaleString()}
                    </title>
                </circle>
            ))}


        </svg>
    );
};

/* ---------------- Page ---------------- */
export const SellerAnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const { sellerId } = useParams();
    const [searchParams] = useSearchParams();
    const listingId = searchParams.get("listingId");

    const [bids, setBids] = useState<BidPoint[]>([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!listingId) return;

        const fetchData = async () => {
            try {
                // Fetch listing info
                const listingRes = await fetch(`http://localhost:8080/api/listings-analytics/${listingId}`);
                const listingJson = await listingRes.json();
                const l = listingJson.result;

                setTitle(`${l.year} ${l.make} ${l.model}`);

                // Fetch bids
                const bidsRes = await fetch(`http://localhost:8080/api/listings-analytics/${listingId}/bids`);
                const bidsJson = await bidsRes.json();

                setBids(Array.isArray(bidsJson.result) ? bidsJson.result : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [listingId]);

    const stats = useMemo(() => {
        const sortedBids = [...bids].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        const totalBids = sortedBids.length;
        const highestBid =
            totalBids > 0 ? Math.max(...sortedBids.map((b) => b.amount)) : 0;

        const firstBidTime =
            totalBids > 0 ? new Date(sortedBids[0].createdAt) : null;
        const lastBidTime =
            totalBids > 0 ? new Date(sortedBids[totalBids - 1].createdAt) : null;

        const timeSpanMinutes =
            firstBidTime && lastBidTime
                ? Math.round((lastBidTime.getTime() - firstBidTime.getTime()) / 60000)
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

        return { totalBids, highestBid, avgIncrease, bidsPerHour };
    }, [bids]);

    if (loading) return <div style={{ padding: 24 }}>Loading analytics…</div>;

    return (
        <div style={{ padding: 24 }}>
            <h1>{title}</h1>
            <p>Seller ID: {sellerId}</p>

            {/* Stats Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    marginTop: 16,
                }}
            >
                <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Highest Bid</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>
                        ${stats.highestBid.toLocaleString()}
                    </div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Total Bids</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.totalBids}</div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Avg Increase</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>
                        {stats.avgIncrease ? `+$${stats.avgIncrease.toLocaleString()}` : "—"}
                    </div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Bid Rate</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>
                        {stats.bidsPerHour}/hr
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 24 }}>
                <h3>Bid History</h3>
                <LineChart bids={bids} />
            </div>

            <Button
                style={{ marginTop: 24 }}
                variant="outline"
                onClick={() => navigate("/account")}
            >
                Back to Account
            </Button>
        </div>
    );
};
