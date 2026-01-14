import React, {useState, useEffect} from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/common/Card";
// import { VehicleHighlights } from "../components/vehicle/VehicleHighlight";

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
  image_url: File[]; // array of image URLs or path to image or img
};


export const ListingDetailPage: React.FC = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<VechileInfo | null>(null);

  useEffect(() =>{
    const fetchVehicle = async () =>{
      const res = await fetch(`http://localhost:8080/api/vehicles/${id}`) 
      const data = await res.json();

      setVehicle(data);
      console.log(data);
    }
    fetchVehicle();
  }, []);

  return (
    <section className="listing-detail-page">
      <Link to="/listings" className="back-link">
        ← Back to listings
      </Link>

      <Card>
        <h2>Imag</h2>
      </Card>

      <h1>Listing #{id}</h1>
      <p>
         page will show full vehicle details, bidding history, and action
        buttons once we hook it to the backend.
      </p>
    </section>
  );
};
