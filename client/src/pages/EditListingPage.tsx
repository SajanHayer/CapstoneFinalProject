import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/common/Button";

type ListingEditForm = {
  description: string;
  end_time: string; // datetime-local value
  reserve_price: number;
  buy_now_price?: number;
  location: string;
};

export const EditListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { listingId } = useParams();

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [form, setForm] = useState<ListingEditForm>({
    description: "",
    end_time: "",
    reserve_price: 0,
    buy_now_price: undefined,
    location: "",
  });

  // ✅ CHANGE THIS BASE IF YOU DIDN'T SEPARATE ROUTES
  // Recommended (no conflicts): /api/listings-analytics
  const API_BASE = "http://localhost:8080/api/listings-analytics";

  // Helper: safely parse JSON or throw readable error
  const safeJson = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        `Expected JSON but got: ${text.slice(0, 160)}${text.length > 160 ? "..." : ""}`,
      );
    }
    return res.json();
  };

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      setError("Missing listingId in URL.");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ uses listingAnalytics GET route: { result: {...} }
        const res = await fetch(`${API_BASE}/${listingId}`);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`GET failed (${res.status}): ${text.slice(0, 160)}`);
        }

        const json = await safeJson(res);
        const l = json?.result;

        if (!l) {
          throw new Error("Missing 'result' from API. Check backend route response.");
        }

        // Locked title fields
        setTitle(`${l.year} ${l.make} ${l.model}`);

        // Check if listing has already started
        const startTime = new Date(l.start_time);
        const now = new Date();
        setHasStarted(startTime <= now);

        // datetime-local expects "YYYY-MM-DDTHH:mm"
        const endLocal = l.end_time
          ? new Date(l.end_time).toISOString().slice(0, 16)
          : "";

        setForm({
          description: l.description ?? "",
          end_time: endLocal,
          reserve_price: Number(l.reserve_price ?? 0),
          buy_now_price: l.buy_now_price != null ? Number(l.buy_now_price) : undefined,
          location: l.location ?? "",
        });
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to load listing.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [listingId]);

  const onSave = async () => {
    if (!listingId) return;

    setSaving(true);
    setError(null);

    try {
      if (!form.end_time) {
        throw new Error("End time is required.");
      }

      const payload = {
        description: form.description,
        end_time: new Date(form.end_time).toISOString(),
        reserve_price: form.reserve_price,
        buy_now_price: form.buy_now_price ?? null,
        location: form.location,
      };

      // ✅ PATCH should be implemented in listingAnalytics router
      const res = await fetch(`${API_BASE}/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`PATCH failed (${res.status}): ${text.slice(0, 200)}`);
      }

      const json = await safeJson(res);
      if (!json?.success && json?.success !== true) {
        // tolerate {success:true} or {ok:true}
        // if backend returns different shape, still navigate
      }

      navigate("/account");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading edit page…</div>;

  if (hasStarted) {
    return (
      <div style={{ padding: 24, maxWidth: 900 }}>
        <h1>Edit Auction</h1>
        <div
          style={{
            padding: 16,
            marginTop: 12,
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: 8,
            color: "#856404",
          }}
        >
          <strong>Cannot Edit Listing</strong>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            This listing has already begun. You can no longer edit auction details once the listing starts.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <Button variant="outline" onClick={() => navigate("/account")}>
            Back to Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>Edit Auction</h1>

      <p style={{ opacity: 0.8 }}>
        <b>{title}</b> (Make/Model/Year locked once bids exist)
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Description</div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={6}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Auction End Time</div>
          <input
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Reserve Price</div>
          <input
            type="number"
            value={form.reserve_price}
            onChange={(e) =>
              setForm((p) => ({ ...p, reserve_price: Number(e.target.value) }))
            }
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Buy Now Price (optional)
          </div>
          <input
            type="number"
            value={form.buy_now_price ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                buy_now_price: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Location</div>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <Button variant="outline" onClick={() => navigate("/account")}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
