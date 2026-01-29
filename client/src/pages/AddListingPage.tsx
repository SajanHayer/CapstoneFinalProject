import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/Select";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/addlisting.css";

type Vehicle = {
  id: number;
  make: string;
  model: string;
  year: number;
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, watch } = useForm<AddListingProps>({
    defaultValues: {
      type: "auction",
    },
  });
  const listingType = watch("type");

  // Fetch user's vehicles
  useEffect(() => {
    const fetchUserVehicles = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:8080/api/vehicles/user/${user.id}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          // Extract vehicles without listings from the result
          if (data.result && Array.isArray(data.result)) {
            const vehiclesWithoutListings = data.result
              .filter((item: any) => !item.listings) // Only vehicles without listings
              .map((item: any) => item.vehicles)
              .filter((v: Vehicle | null, idx: number, arr: any[]) => v && arr.findIndex(vehicle => vehicle?.id === v.id) === idx);
            setVehicles(vehiclesWithoutListings);
          }
        }
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVehicles();
  }, [user?.id]);

  const onSubmit = async (data: AddListingProps) => {
    // console.log("Form data:", data);
    data.seller_id = user?.id || 0;
    try{
        const res = await fetch('http://localhost:8080/api/listings/create',{
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
        const result = await res.json();
        if (!res.ok || result.error) {
          alert(result.message || "Error uploading vehicle");
        } else {
            alert("Listing added successfully!");
            navigate("/account");
        }
    }catch(err){
        console.error("Error creating listing:", err);
    }
  };

  return (
    <div className="add-listing-container">
      <div className="add-listing-header">
        <h1>Create New Listing</h1>
        <p>Set up your vehicle for auction or fixed price sale</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="add-listing-form">
        {/* Vehicle Selection */}
        <div className="form-section">
          <h3>Vehicle</h3>
          {loading ? (
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Loading your vehicles...</p>
          ) : vehicles.length === 0 ? (
            <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>
              No vehicles found. Please add a vehicle first.
            </p>
          ) : (
            <Select
              {...register("vehicle_id", { required: true, valueAsNumber: true })}
            >
              <option value="">Select a vehicle from your garage</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Listing Type Selection */}
        <div className="form-section">
          <h3>Listing Type</h3>
          <div className="listing-type-selector">
            <button
              type="button"
              className={`type-tag ${listingType === "auction" ? "active" : ""}`}
              onClick={() => register("type").onChange({ target: { value: "auction" } })}
            >
              <span className="type-label">Auction</span>
              <span className="type-description">Let buyers bid</span>
            </button>
            <button
              type="button"
              className={`type-tag ${listingType === "fixed" ? "active" : ""}`}
              onClick={() => register("type").onChange({ target: { value: "fixed" } })}
            >
              <span className="type-label">Fixed Price</span>
              <span className="type-description">Set a price</span>
            </button>
          </div>
          <input type="hidden" {...register("type")} />
        </div>

        {/* Pricing Section */}
        <div className="form-section">
          <h3>Pricing</h3>
          <div className="form-grid">
            <Input
              label="Starting Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("start_price", { required: true, valueAsNumber: true })}
            />
            <Input
              label="Reserve Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("reserve_price", { required: true, valueAsNumber: true })}
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
              {...register("start_time", { required: true })}
            />
            <Input
              label="End Time"
              type="datetime-local"
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
          <Button type="submit">Create Listing</Button>
        </div>
      </form>
    </div>
  );
};
