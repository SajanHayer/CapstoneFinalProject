import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import "../styles/addvehicle.css";

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
      setError("Guest mode can't publish vehicles. Please sign in to list a vehicle.");
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
      setTimeout(() => navigate("/account"), 650);
    } catch (e: any) {
      setError(e?.message || "Failed to publish vehicle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="add-vehicle-container">
      {/* Header */}
      <div className="av-card av-header">
        <div className="av-header-top">
          <div className="av-header-content">
            <div className="av-header-title">List a vehicle</div>
            <div className="av-header-subtitle">
              Sponsor-ready listings: clean data, crisp photos, and clear status.
            </div>
          </div>
          <div className="av-header-actions">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={publish} disabled={!canPublish || saving}>
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        {(isGuest || error || ok) && (
          <div className="av-alerts">
            {isGuest && (
              <div className="av-alert av-alert-info">
                You're in Guest mode — you can browse everything, but you can't publish vehicles.
              </div>
            )}
            {error && <div className="av-alert av-alert-error">{error}</div>}
            {ok && <div className="av-alert av-alert-success">{ok}</div>}
          </div>
        )}
      </div>

      {/* Main */}
      <div className="av-grid">
        {/* Form */}
        <div className="av-card">
          <div className="av-section-title">Vehicle details</div>

          <div className="av-grid-2">
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

          <div className="av-grid-3">
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

          <div className="av-grid-2">
            <LabeledSelect
              label="Condition"
              value={form.condition}
              onChange={(v) => update("condition", v)}
              options={[
                { label: "Used", value: "used" },
                { label: "New", value: "new" },
              ]}
            />
          </div>

          <div className="av-input-group" style={{ marginTop: 14 }}>
            <label className="av-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Short, clean description…"
              className="av-textarea"
            />
          </div>
        </div>

        {/* Photos + Preview */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="av-card">
            <div className="av-section-title">Photos</div>
            <div className="av-section-subtitle">
              Add up to {MAX_IMAGES}. First photo becomes the thumbnail.
            </div>

            <div className="av-photos-actions">
              <label className="av-photo-upload-btn">
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
                className="av-photo-clear-btn"
                disabled={!images.length}
                onClick={() => setImages([])}
              >
                Clear
              </button>
            </div>

            <div className="av-photos-grid">
              {previews.length === 0 ? (
                <div className="av-photo-empty">
                  No photos yet. Upload a few to make the listing pop.
                </div>
              ) : (
                previews.map((src, i) => (
                  <div key={src} className="av-photo-thumb">
                    <img src={src} alt={"preview-" + i} />
                    {i === 0 && <div className="av-photo-badge">Thumbnail</div>}
                    <button 
                      onClick={() => removeImage(i)} 
                      className="av-photo-remove-btn"
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="av-card">
            <div className="av-section-title">Listing preview</div>
            <div className="av-preview-vehicle">
              <div className="av-preview-title">
                {form.year || "Year"} {form.make || "Make"} {form.model || "Model"}
              </div>
              <div className="av-preview-pills">
                <Pill text={`Condition: ${form.condition}`} />
                <Pill text={`Status: ${form.status}`} />
                <Pill text={`Mileage/Hrs: ${form.mileage_hours || 0}`} />
              </div>
              <div className="av-preview-description">
                {form.description?.trim()
                  ? form.description.trim()
                  : "Add a short description so buyers understand the vehicle at a glance."}
              </div>
              <div className="av-preview-price">
                ${Number(form.price || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
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
    <div className="av-input-group">
      <label className="av-label">{text}</label>
      <input
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="av-input"
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
    <div className="av-input-group">
      <label className="av-label">{text}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="av-select">
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
  return <span className="av-pill">{text}</span>;
}
