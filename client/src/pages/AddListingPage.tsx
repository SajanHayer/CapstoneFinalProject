import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/Select";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { localToUTC } from "../lib/dateUtils";
import "../styles/addlisting.css";

type Vehicle = {
  id: number;
  make: string;
  model: string;
  year: number;
  price?: number;
  hasActiveListing?: boolean;
};

type AddListingProps = {
  seller_id: number;
  vehicle_id: number;
  type: "auction" | "fixed";
  start_price: number | "";
  reserve_price: number | "";
  buy_now_price: number | "";
  start_time: string;
  end_time: string;
  location: string;
};

export const AddListingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleIdFromParams = searchParams.get("vehicleId");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [userLocation, setUserLocation] = useState<string>("");
  const [selectedVehicleHasActiveListing, setSelectedVehicleHasActiveListing] =
    useState(false);
  const { register, handleSubmit, watch, setValue } = useForm<AddListingProps>({
    defaultValues: {
      type: "auction",
      vehicle_id: vehicleIdFromParams ? Number(vehicleIdFromParams) : undefined,
    },
  });
  const listingType = watch("type");
  const startTime = watch("start_time");
  const reservePrice = watch("reserve_price");
  const selectedVehicleId = watch("vehicle_id");

  // Calculate starting price as 75% of reserve price
  useEffect(() => {
    if (reservePrice && !isNaN(Number(reservePrice))) {
      const calculatedStartPrice = Number(reservePrice) * 0.75;
      setValue("start_price", calculatedStartPrice);
    }
  }, [reservePrice, setValue]);

  // Check if selected vehicle has active listing
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const selected = vehicles.find((v) => v.id === selectedVehicleId);
      setSelectedVehicleHasActiveListing(selected?.hasActiveListing || false);
      // Auto-fill reserve price with vehicle price
      if (selected?.price) {
        setValue("reserve_price", selected.price);
      }
    }
  }, [selectedVehicleId, vehicles, setValue]);

  // Get minimum datetime (now) in correct format for datetime-local
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get minimum end time (start time or later)
  const getMinEndTime = () => {
    if (!startTime) return getMinDateTime();
    return startTime;
  };

  // Fetch user's vehicles and location
  useEffect(() => {
    const fetchUserVehicles = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Get user's location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });

          // Try to get city name from coordinates using reverse geocoding
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          )
            .then((res) => res.json())
            .then((data) => {
              // Extract city and state/province from the response
              const city =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                "";
              const state = data.address?.state || "";
              if (city && state) {
                setUserLocation(`${city}, ${state}`);
                // Auto-fill location in form
                setValue("location", `${city}, ${state}`);
              } else if (city) {
                setUserLocation(city);
                setValue("location", city);
              }
            })
            .catch((err) => {
              console.log("Reverse geocoding failed:", err);
              toast.error("Failed to get your location. Please enter it manually.");
            });
        },
        (error) => {
          console.log("Geolocation error:", error);
          toast.error("Please enable location access to auto-fill your location.");
        },
      );

      try {
        const res2 = await fetch(
          `http://localhost:8080/api/vehicles/${vehicleIdFromParams}`,
          { credentials: "include" },
        );
        const data = await res2.json();
        const { id, make, model, year, price } = data.vehicle;
        const vehicleDetails: Vehicle = { id, make, model, year, price };
        setVehicles([vehicleDetails]);
      } catch (err) {
        toast.error("Failed to load vehicle information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserVehicles();
  }, [user?.id, setValue]);

  const onSubmit = async (data: AddListingProps) => {
    // console.log("Form data:", data);
    data.seller_id = user?.id || 0;

    // Convert local datetime strings to UTC
    const startTime = localToUTC(data.start_time);
    const endTime = localToUTC(data.end_time);

    try {
      const res = await fetch("http://localhost:8080/api/listings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          start_time: startTime,
          end_time: endTime,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        toast.error(result.message || "Error uploading vehicle");
      } else {
        toast.success("Listing added successfully!");
        navigate("/account");
      }
    } catch (err) {
      toast.error("Error creating listing. Please try again.");
    }
  };

  return (
    <div className="add-listing-container">
      <button
        type="button"
        onClick={() =>
          navigate("/vehicle/" + selectedVehicleId, {
            state: { vehicleId: selectedVehicleId },
          })
        }
        className="back-button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          marginBottom: "24px",
          backgroundColor: "transparent",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          color: "#4b5563",
        }}
      >
        ← Back to Vehicle
      </button>
      <div className="add-listing-header">
        <h1>Create New Listing</h1>
        <p>Set up your vehicle for auction</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="add-listing-form">
        {/* Vehicle Selection */}
        <div className="form-section">
          <h3>Vehicle</h3>
          {loading ? (
            <p className="form-loading-text">Loading your vehicles...</p>
          ) : vehicles.length === 0 ? (
            <p className="form-error-text">
              No vehicles found. Please add a vehicle first.
            </p>
          ) : (
            <>
              <Select
                {...register("vehicle_id", {
                  required: true,
                  valueAsNumber: true,
                })}
              >
                <option value="">Select a vehicle from your garage</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                    {vehicle.hasActiveListing ? " (Active Listing)" : ""}
                  </option>
                ))}
              </Select>
              {selectedVehicleHasActiveListing && (
                <p
                  style={{
                    color: "#dc2626",
                    fontSize: "14px",
                    marginTop: "8px",
                    fontWeight: 500,
                  }}
                >
                  ⚠️ This vehicle has an active listing or a recent listing that
                  has ended. Please complete or remove that listing before
                  adding a new one.
                </p>
              )}
            </>
          )}
        </div>

        {/* Listing Type Selection */}
        <div className="form-section">
          <h3>Listing Type</h3>
          <div className="listing-type-selector">
            <button
              type="button"
              className={`type-tag ${listingType === "auction" ? "active" : ""}`}
              onClick={() =>
                register("type").onChange({ target: { value: "auction" } })
              }
            >
              <span className="type-label">Auction</span>
              <span className="type-description">Let buyers bid</span>
            </button>
          </div>
          <input type="hidden" {...register("type")} />
        </div>

        {/* Pricing Section */}
        <div className="form-section">
          <h3>Pricing</h3>
          <div className="form-grid">
            <Input
              label="Starting Price (75% of Reserve Price)"
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled
              {...register("start_price", {
                required: true,
                valueAsNumber: true,
              })}
            />
            <Input
              label="Reserve Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("reserve_price", {
                required: true,
                valueAsNumber: true,
              })}
            />
            <Input
              label="Buy Now Price (Optional)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("buy_now_price", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Timeline Section */}
        <div className="form-section">
          <h3>Timeline</h3>
          <div className="form-grid">
            <Input
              label="Start Time"
              type="datetime-local"
              min={getMinDateTime()}
              {...register("start_time", { required: true })}
            />
            <Input
              label="End Time"
              type="datetime-local"
              min={getMinEndTime()}
              {...register("end_time", { required: true })}
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="form-section">
          <h3>Location</h3>
          <Input
            label="Location"
            type="text"
            placeholder="e.g., Toronto, ON"
            {...register("location", { required: true })}
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <Button
            type="submit"
            disabled={!selectedVehicleId || selectedVehicleHasActiveListing}
            title={
              selectedVehicleHasActiveListing
                ? "Cannot create listing - this vehicle already has an active listing"
                : !selectedVehicleId
                  ? "Please select a vehicle"
                  : ""
            }
          >
            Create Listing
          </Button>
        </div>
      </form>
    </div>
  );
};
