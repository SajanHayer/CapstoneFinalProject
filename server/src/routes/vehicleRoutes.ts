import { Router } from "express";
import { db } from "../db/db";
import { vehicles } from "../db/schema";
import { eq } from "drizzle-orm";


const vehicleRouter = Router();

/* ----------------------------------------------
   POST /api/vehicles  → Create a vehicle
------------------------------------------------ */
vehicleRouter.post("/", async (req, res) => {
  try {
    const {
      user_id,
      make,
      model,
      year,
      price,
      mileage_hours,
      condition,
      status,
      description,
      image_url,
    } = req.body;

    if (!user_id || !make || !model || !year || !price) {
      return res.status(400).json({
        message: "user_id, make, model, year, and price are required",
      });
    }

    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        user_id,
        make,
        model,
        year,
        price,
        mileage_hours: mileage_hours ?? 0,
        condition,
        status,
        description,
        image_url,
      })
      .returning();

    res.status(201).json({ vehicle: newVehicle });
  } catch (err) {
    console.error("Create vehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/vehicles  → Get all vehicles
------------------------------------------------ */
vehicleRouter.get("/", async (_req, res) => {
  try {
    const result = await db.select().from(vehicles);
    res.json({ vehicles: result });
  } catch (err) {
    console.error("Fetch vehicles error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------
   GET /api/vehicles/:id  → Get vehicle by ID
------------------------------------------------ */
vehicleRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [vehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, id));

    if (!vehicle) { 
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ vehicle });
  } catch (err) {
    console.error("Get vehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default vehicleRouter;
