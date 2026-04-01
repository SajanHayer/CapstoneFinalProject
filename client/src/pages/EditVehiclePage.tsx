import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
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
  description: string;
  vin: string;
  style: string;
  engine_size: string;
  engine_size_unit: string;
};

const MAX_IMAGES = 8;

export const EditVehiclePage: React.FC = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  useAuth();

  const [form, setForm] = useState<VehicleDraft>({
    make: "",
    model: "",
    year: String(new Date().getFullYear()),
    price: "",
    mileage_hours: "0",
    condition: "used",
    description: "",
    vin: "",
    style: "",
    engine_size: "",
    engine_size_unit: "L",
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const previews = useMemo(
    () => images.map((f) => URL.createObjectURL(f)),
    [images],
  );

  // Fetch vehicle data on mount
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        if (!vehicleId) {
          setError("Vehicle ID not found");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:8080/api/vehicles/${vehicleId}`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          toast.error("Failed to load vehicle information");
          throw new Error("Failed to fetch vehicle");
        }

        const data = await res.json();
        const vehicle = data.vehicle;

        setForm({
          make: vehicle.make,
          model: vehicle.model,
          year: String(vehicle.year),
          price: String(vehicle.price),
          mileage_hours: String(vehicle.mileage_hours),
          condition: vehicle.condition,
          description: vehicle.description,
          vin: vehicle.vin || "",
          style: vehicle.style || "",
          engine_size: vehicle.engine_size || "",
          engine_size_unit: vehicle.engine_size_unit || "L",
        });

        setExistingImages(vehicle.image_url || []);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load vehicle";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  function update<K extends keyof VehicleDraft>(k: K, v: VehicleDraft[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const totalImages = existingImages.length + images.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setError(
        `Maximum ${MAX_IMAGES} images allowed. You currently have ${existingImages.length + images.length}.`,
      );
      return;
    }
    const next = [...images, ...files].slice(
      0,
      MAX_IMAGES - existingImages.length,
    );
    setImages(next);
    e.target.value = "";
  }

  function removeNewImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeExistingImage(idx: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setError(null);
    setOk(null);

    if (!form.make.trim() || !form.model.trim()) {
      const msg = "Make and model are required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!form.year || Number.isNaN(Number(form.year))) {
      const msg = "Year is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!form.price || Number.isNaN(Number(form.price))) {
      const msg = "Price is required.";
      setError(msg);
      toast.error(msg);
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
      fd.append("description", form.description.trim());
      fd.append("vin", form.vin.trim());
      fd.append("style", form.style.trim());
      fd.append("engine_size", form.engine_size.trim());
      fd.append("engine_size_unit", form.engine_size_unit);

      // Add existing images that weren't removed
      fd.append("existingImages", JSON.stringify(existingImages));

      // Add new images
      images.forEach((file) => fd.append("images", file));

      const res = await fetch(
        `http://localhost:8080/api/vehicles/${vehicleId}`,
        {
          method: "PUT",
          credentials: "include",
          body: fd,
        },
      );

      if (!res.ok) {
        const data = await res.json();
        const errorMsg =
          data.message || `Failed to update vehicle (${res.status})`;
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      const successMsg = "Vehicle updated successfully!";
      setOk(successMsg);
      toast.success(successMsg);
      setTimeout(() => navigate(`/vehicle/${vehicleId}`), 650);
    } catch (e: any) {
      setError(e?.message || "Failed to update vehicle.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="add-vehicle-container">
        <div className="av-card av-header">
          <p>Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-vehicle-container">
      {/* Header */}
      <div className="av-card av-header">
        <div className="av-header-top">
          <div className="av-header-content">
            <div className="av-header-title">Edit Vehicle</div>
            <div className="av-header-subtitle">
              Update vehicle details and images.
            </div>
          </div>
          <div className="av-header-actions">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {(error || ok) && (
          <div className="av-alerts">
            {error && (
              <div className="av-alert av-alert-error">
                <strong>Error:</strong> {error}
              </div>
            )}
            {ok && (
              <div className="av-alert av-alert-success">
                <strong>Success:</strong> {ok}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="av-card av-form-section">
        <div className="av-section-title">Vehicle Information</div>

        <div className="av-grid av-grid-2">
          <div className="av-field">
            <label className="av-label">Make</label>
            <input
              className="av-input"
              type="text"
              value={form.make}
              onChange={(e) => update("make", e.target.value)}
              placeholder="e.g., Honda"
            />
          </div>

          <div className="av-field">
            <label className="av-label">Model</label>
            <input
              className="av-input"
              type="text"
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              placeholder="e.g., CB500F"
            />
          </div>
        </div>

        <div className="av-grid av-grid-2">
          <div className="av-field">
            <label className="av-label">Year</label>
            <input
              className="av-input"
              type="number"
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="av-field">
            <label className="av-label">Condition</label>
            <select
              className="av-input"
              value={form.condition}
              onChange={(e) => update("condition", e.target.value)}
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        <div className="av-grid av-grid-2">
          <div className="av-field">
            <label className="av-label">Price ($)</label>
            <input
              className="av-input"
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="av-field">
            <label className="av-label">Mileage/Hours</label>
            <input
              className="av-input"
              type="number"
              value={form.mileage_hours}
              onChange={(e) => update("mileage_hours", e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className="av-grid av-grid-2">
          <div className="av-field">
            <label className="av-label">VIN</label>
            <input
              className="av-input"
              type="text"
              value={form.vin}
              onChange={(e) => update("vin", e.target.value)}
              placeholder="e.g., 1HGBH41JXMN109186"
            />
          </div>

          <div className="av-field">
            <label className="av-label">Style</label>
            <input
              className="av-input"
              type="text"
              value={form.style}
              onChange={(e) => update("style", e.target.value)}
              placeholder="e.g., Sport, Touring"
            />
          </div>
        </div>

        <div className="av-field">
          <label className="av-label">Engine Size</label>
          <input
            className="av-input"
            type="number"
            value={form.engine_size}
            onChange={(e) => update("engine_size", e.target.value)}
            placeholder="e.g., 2.5"
            step="0.1"
            min="0"
          />
        </div>

        <div className="av-field">
          <label className="av-label">Engine Size Unit</label>
          <select
            className="av-input"
            value={form.engine_size_unit}
            onChange={(e) => update("engine_size_unit", e.target.value)}
          >
            <option value="L">Liters (L)</option>
            <option value="CC">Cubic Centimeters (CC)</option>
            <option value="HP">Horsepower (HP)</option>
          </select>
        </div>

        <div className="av-field">
          <label className="av-label">Description</label>
          <textarea
            className="av-input av-textarea"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the vehicle condition, features, and history..."
            rows={6}
          />
        </div>
      </div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="av-card av-form-section">
          <div className="av-section-title">Current Images</div>
          <div className="av-gallery-grid">
            {existingImages.map((img, idx) => (
              <div key={idx} className="av-image-card">
                <img src={img} alt={`Vehicle ${idx + 1}`} />
                <button
                  type="button"
                  className="av-image-remove"
                  onClick={() => removeExistingImage(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Images */}
      <div className="av-card av-form-section">
        <div className="av-section-title">
          Add New Images{" "}
          <span className="av-image-count">
            ({existingImages.length + images.length}/{MAX_IMAGES})
          </span>
        </div>

        <div className="av-image-upload">
          <input
            id="image-input"
            type="file"
            multiple
            accept="image/*"
            onChange={onPickImages}
            disabled={existingImages.length + images.length >= MAX_IMAGES}
            style={{ display: "none" }}
          />
          <label htmlFor="image-input" className="av-upload-label">
            <div className="av-upload-icon">📷</div>
            <div className="av-upload-text">
              Click to select images or drag and drop
            </div>
            <div className="av-upload-subtext">
              PNG, JPG, GIF up to {MAX_IMAGES} images
            </div>
          </label>
        </div>

        {previews.length > 0 && (
          <div className="av-gallery-grid" style={{ marginTop: "16px" }}>
            {previews.map((preview, idx) => (
              <div key={idx} className="av-image-card">
                <img src={preview} alt={`Preview ${idx + 1}`} />
                <button
                  type="button"
                  className="av-image-remove"
                  onClick={() => removeNewImage(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="av-card av-footer">
        <div className="av-footer-actions">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};
