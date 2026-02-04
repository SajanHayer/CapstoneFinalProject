import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

type VehicleDraft = {
  make: string;
  model: string;
  year: string;
  price: string;
  mileage_hours: string;
  condition: string;
  status: string;
  description: string;
};

const MAX_IMAGES = 8;

export const AddVehiclePage: React.FC = () => {
  const navigate = useNavigate();
  const { isGuest, isLoggedIn } = useAuth();

  const [form, setForm] = useState<VehicleDraft>({
    make: "",
    model: "",
    year: String(new Date().getFullYear()),
    price: "",
    mileage_hours: "0",
    condition: "used",
    status: "Active",
    description: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canPublish = isLoggedIn && !isGuest;

  function update<K extends keyof VehicleDraft>(k: K, v: VehicleDraft[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...images, ...files].slice(0, MAX_IMAGES);
    setImages(next);
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function publish() {
    setError(null);
    setOk(null);

    if (!canPublish) {
      setError("Guest mode can’t publish vehicles. Please sign in to list a vehicle.");
      return;
    }

    if (!form.make.trim() || !form.model.trim()) {
      setError("Make and model are required.");
      return;
    }

    if (!form.year || Number.isNaN(Number(form.year))) {
      setError("Year is required.");
      return;
    }

    if (!form.price || Number.isNaN(Number(form.price))) {
      setError("Price is required.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("make", form.make.trim());
      fd.append("model", form.model.trim());
      fd.append("year", String(Number(form.year)));
      fd.append("price", String(Number(form.price)));
      fd.append("mileage_hours", String(Number(form.mileage_hours || 0)));
      fd.append("condition", form.condition);
      fd.append("status", form.status);
      fd.append("description", form.description.trim());

      images.forEach((file) => fd.append("images", file));

      const res = await fetch("http://localhost:8080/api/vehicles/create", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }

      setOk("Vehicle published!");
      setTimeout(() => navigate("/marketplace"), 650);
    } catch (e: any) {
      setError(e?.message || "Failed to publish vehicle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "26px 18px 60px" }}>
      {/* Header */}
      <div style={card()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>List a vehicle</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
              Sponsor-ready listings: clean data, crisp photos, and clear status.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={publish} disabled={!canPublish || saving}>
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        {(isGuest || error || ok) && (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {isGuest && (
              <div style={alert("info")}>
                You’re in Guest mode — you can browse everything, but you can’t publish vehicles.
              </div>
            )}
            {error && <div style={alert("error")}>{error}</div>}
            {ok && <div style={alert("success")}>{ok}</div>}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }} className="av-grid">
        {/* Form */}
        <div style={card()}>
          <div style={sectionTitle()}>Vehicle details</div>

          <div style={grid2()}>
            <LabeledInput
              label="Make"
              value={form.make}
              placeholder="e.g., Honda"
              onChange={(v) => update("make", v)}
            />
            <LabeledInput
              label="Model"
              value={form.model}
              placeholder="e.g., CRF250R"
              onChange={(v) => update("model", v)}
            />
          </div>

          <div style={grid3()}>
            <LabeledInput
              label="Year"
              value={form.year}
              type="number"
              onChange={(v) => update("year", v)}
            />
            <LabeledInput
              label="Price"
              value={form.price}
              type="number"
              placeholder="e.g., 7899"
              onChange={(v) => update("price", v)}
            />
            <LabeledInput
              label="Mileage / Hours"
              value={form.mileage_hours}
              type="number"
              onChange={(v) => update("mileage_hours", v)}
            />
          </div>

          <div style={grid2()}>
            <LabeledSelect
              label="Condition"
              value={form.condition}
              onChange={(v) => update("condition", v)}
              options={[
                { label: "Used", value: "used" },
                { label: "New", value: "new" },
              ]}
            />
            <LabeledSelect
              label="Status"
              value={form.status}
              onChange={(v) => update("status", v)}
              options={[
                { label: "Active", value: "Active" },
                { label: "Upcoming", value: "Upcoming" },
                { label: "Ended", value: "Ended" },
              ]}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={label()}>Description</div>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Short, clean description…"
              style={textarea()}
            />
          </div>
        </div>

        {/* Photos + Preview */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={card()}>
            <div style={sectionTitle()}>Photos</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
              Add up to {MAX_IMAGES}. First photo becomes the thumbnail.
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label style={pillBtn()}>
                Upload photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickImages}
                  style={{ display: "none" }}
                />
              </label>
              <button
                style={ghostBtn(!images.length)}
                disabled={!images.length}
                onClick={() => setImages([])}
              >
                Clear
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {previews.length === 0 ? (
                <div style={emptyBox()}>
                  No photos yet. Upload a few to make the listing pop.
                </div>
              ) : (
                previews.map((src, i) => (
                  <div key={src} style={thumb()}>
                    <img src={src} alt={"preview-" + i} style={thumbImg()} />
                    {i === 0 && <div style={badge()}>Thumbnail</div>}
                    <button onClick={() => removeImage(i)} style={removeBtn()} title="Remove">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={card()}>
            <div style={sectionTitle()}>Listing preview</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: "var(--text)" }}>
                {form.year || "Year"} {form.make || "Make"} {form.model || "Model"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill text={`Condition: ${form.condition}`} />
                <Pill text={`Status: ${form.status}`} />
                <Pill text={`Mileage/Hrs: ${form.mileage_hours || 0}`} />
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {form.description?.trim()
                  ? form.description.trim()
                  : "Add a short description so buyers understand the vehicle at a glance."}
              </div>
              <div style={{ fontSize: 18, fontWeight: 950, color: "var(--text)" }}>
                ${Number(form.price || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .av-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

function LabeledInput({
  label: text,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={label()}>{text}</div>
      <input
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={input()}
      />
    </div>
  );
}

function LabeledSelect({
  label: text,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={label()}>{text}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input()}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span
      style={{
        border: "1px solid var(--border)",
        background: "var(--bg)",
        color: "var(--text)",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  );
}

function card(): React.CSSProperties {
  return {
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--card)",
    boxShadow: "var(--shadow)",
    padding: 18,
  };
}

function sectionTitle(): React.CSSProperties {
  return { fontSize: 14, fontWeight: 950, color: "var(--text)" };
}

function label(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 900, color: "var(--muted)", marginBottom: 6 };
}

function input(): React.CSSProperties {
  return {
    width: "100%",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    padding: "10px 12px",
    outline: "none",
  };
}

function textarea(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 120,
    resize: "vertical",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    padding: 12,
    outline: "none",
  };
}

function grid2(): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
}

function grid3(): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };
}

function alert(type: "info" | "error" | "success"): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 14,
    padding: "10px 12px",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    fontWeight: 800,
    fontSize: 13,
  };
  if (type === "error") return { ...base, borderColor: "rgba(239,68,68,0.55)" };
  if (type === "success") return { ...base, borderColor: "rgba(34,197,94,0.55)" };
  return { ...base, borderColor: "rgba(59,130,246,0.55)" };
}

function pillBtn(): React.CSSProperties {
  return {
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 950,
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid var(--border)",
    color: "white",
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    boxShadow: "0 10px 18px rgba(0,0,0,0.18)",
  };
}

function ghostBtn(disabled?: boolean): React.CSSProperties {
  return {
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 900,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    border: "1px solid transparent",
    color: "var(--text)",
    background: "transparent",
  };
}

function emptyBox(): React.CSSProperties {
  return {
    gridColumn: "1 / -1",
    border: "1px dashed var(--border)",
    borderRadius: 16,
    padding: 18,
    color: "var(--muted)",
    background: "var(--bg)",
  };
}

function thumb(): React.CSSProperties {
  return {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    aspectRatio: "4 / 3",
  };
}

function thumbImg(): React.CSSProperties {
  return { width: "100%", height: "100%", objectFit: "cover" };
}

function badge(): React.CSSProperties {
  return {
    position: "absolute",
    left: 10,
    top: 10,
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 950,
    color: "white",
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    boxShadow: "0 10px 18px rgba(0,0,0,0.25)",
  };
}

function removeBtn(): React.CSSProperties {
  return {
    position: "absolute",
    right: 8,
    top: 8,
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "rgba(0,0,0,0.45)",
    color: "white",
    padding: "6px 10px",
    cursor: "pointer",
  };
}
