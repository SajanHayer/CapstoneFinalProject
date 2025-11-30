import React from "react";
import { Input} from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/Select";
import { useForm } from "react-hook-form"
import { useRef } from "react";

type AddVehicleProps = {
    user_id: number;
    make: string;
    model: string;
    year: number;
    price: number | "";
    mileage_hours: number | ""; 
    condition: "new" | "used";
    status: "available" | "pending" | "sold";
    description: string | "";
    image_url: string[]; // array of image URLs or path to image or img
};

// Change image upload to be of of actual file types
    // handle multiple images
// change these image to a file
// send this array of files to backend




export const AddVehiclePage: React.FC = () => {
    const [imageUrls, setImageUrls] = React.useState<string[]>([]);
    const { register, handleSubmit } = useForm<AddVehicleProps>();
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const newImageUrls = filesArray.map((file) => URL.createObjectURL(file));
            setImageUrls([...imageUrls, ...newImageUrls]);
        }
    }
    const onSubmit = async (data: AddVehicleProps) => {
    console.log(data);
    try{
        const res = await fetch("http://localhost:8080/api/vehicles/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: 1, // hardcoded for now
          make: data.make,
          model: data.model,
          year: data.year,
          price: data.price,
          mileage_hours: data.mileage_hours,
          condition: data.condition,
          status: data.status,
          description: data.description,
          image_url: data.image_url,
        }),
      });
      const result = await res.json();
      console.log("Result:", result);
    } catch (err) {
        console.error("Add vehicle error:", err);
    }
  };
    return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Make" {...register("make", {required: true})}/>
      <Input label="Model" {...register("model", { required: true })} />    
      <Input label="Year" type="number"{...register("year", { required: true, valueAsNumber: true })}/>
      <Input label="Price" type="number"{...register("price", { required: true, valueAsNumber: true })}/>
      <Input label="Mileage Hours" type="number" {...register("mileage_hours", { required: true, valueAsNumber: true })}/>
      <div style={{padding: "2px 2px", marginBottom: "1px" }}>
        <Select {...register("condition", { required: true })}>
            <option value="new">New</option>
            <option value="used">Used</option>
        </Select>
      </div>

      <div style={{padding: "2px 2px", marginBottom: "1px" }}>
        <Select {...register("status", { required: true })}>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
         </Select>
      </div>

      <div style={{padding: "2px 2px", marginBottom: "1px" }}>
        <textarea {...register("description", { required: true })} />
      </div>

      {/* Hidden file input */}
      <div style={{padding: "2px 2px", marginBottom: "1px" }}>
        <input
            type="file"
            multiple
            {...register("image_url")}
            accept="image/*"
            ref={imageInputRef} // attach ref for button click
            style={{ display: "none" }}
            onChange={handleImageChange}
        />

      {/* Custom button to trigger file input */}
      <Button type="button" onClick={() => imageInputRef.current?.click()}>
        Upload Images
      </Button>
      </div>
    
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {imageUrls.map((url, index) => (
            <img
            key={index}
            src={url}
            alt={`img-${index}`}
            width={150}
            height={150}
            style={{ objectFit: "cover" }}
            />
        ))}
        </div>

      <Button type="submit">Add Vehicle</Button>
    </form>
  );
};