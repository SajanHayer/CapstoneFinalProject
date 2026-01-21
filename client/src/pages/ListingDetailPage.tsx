import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { VehicleHighlights } from "../components/vehicle/VehicleHighlight";
import { ImageGallery } from "../components/vehicle/ImageGallery";

type VechileInfo = {
  user_id: number;
  make: string;
  model: string;
  year: number;
  price: number | "";
  mileage_hours: number | "";
  condition: "new" | "used";
  status: "available" | "pending" | "sold";
  description: string | "";
  image_url: string[] | File[]; // array of image URLs or path to image or img
};

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<VechileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/vehicles/${id}`);
        const data = await res.json();
        setVehicle(data.vehicle);
        console.log(data.vehicle);
      } catch (err) {
        setError("Failed to load vehicle details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  if (loading) {
    return (
      <section className="min-h-screen pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-neutral-600">Loading vehicle details...</p>
        </div>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="min-h-screen pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/listings"
            className="text-primary-600 hover:text-primary-700 font-semibold mb-4 inline-block"
          >
            ← Back to listings
          </Link>
          <p className="text-red-600">{error || "Vehicle not found"}</p>
        </div>
      </section>
    );
  }

  // Grouped vehicle information
  const vehicleBasics = [
    { title: "Year", value: String(vehicle.year) },
    { title: "Make", value: vehicle.make },
    { title: "Model", value: vehicle.model },
  ];

  const vehicleSpecs = [
    {
      title: "Mileage Hours",
      value: vehicle.mileage_hours ? String(vehicle.mileage_hours) : "N/A",
    },
    {
      title: "Condition",
      value:
        vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1),
    },
    {
      title: "Price",
      value: vehicle.price
        ? `$${Number(vehicle.price).toLocaleString()}`
        : "N/A",
    },
    {
      title: "Status",
      value: vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1),
    },
  ];

  return (
    <section className="min-h-screen pt-20 pb-12 px-4 bg-neutral-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/listings"
          className="text-primary-600 hover:text-primary-700 font-semibold inline-block"
        >
          ← Back to listings
        </Link>

        <Card className="bg-gradient-to-r from-neutral-800 to-neutral-900 text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-neutral-300 text-sm">
                  {vehicle.condition.charAt(0).toUpperCase() +
                    vehicle.condition.slice(1)}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded text-sm font-mono text-neutral-100">
                  VIN: TBD
                </span>
              </div>
            </div>
            <button className="bg-white text-neutral-900 px-6 py-2 rounded-lg font-bold hover:bg-neutral-100 transition-colors">
              Gallery
            </button>
          </div>
        </Card>

        {/* Image Gallery */}
        {vehicle.image_url &&
          Array.isArray(vehicle.image_url) &&
          vehicle.image_url.length > 0 && (
            <ImageGallery
              images={vehicle.image_url.map((img) =>
                typeof img === "string" ? img : URL.createObjectURL(img),
              )}
              title="Gallery"
            />
          )}

        {/* Vehicle Basics Card */}
        <VehicleHighlights items={vehicleBasics} />

        {/* Vehicle Specs Card */}
        <VehicleHighlights items={vehicleSpecs} />

        {/* Description Card - Full Width */}
        {vehicle.description && (
          <Card className="bg-white col-span-full">
            <p className="text-sm text-neutral-600 font-semibold uppercase tracking-wide mb-3">
              Description
            </p>
            <p className="text-neutral-800 leading-relaxed">
              {vehicle.description}
            </p>
          </Card>
        )}
      </div>
    </section>
  );
};
