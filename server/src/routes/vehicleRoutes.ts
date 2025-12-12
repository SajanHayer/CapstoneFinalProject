import { Router } from "express";
import { db } from "../db/db";
import { vehicles } from "../db/schema";
import { eq } from "drizzle-orm";
import { supabase } from "../services/supabase";
import multer from "multer";
import imageCompression from "browser-image-compression";
import { requireAuth } from "../middleware/requireAuth";

export const vehicleRouter = Router();
const SUPABASE_BUCKET = "powerbidz-images";

//function to send image to supabase storage and get url
/* ----------------------------------------------
   POST /api/vehicles/create  → Create a vehicle
------------------------------------------------ */

const upload = multer({ storage: multer.memoryStorage() });

vehicleRouter.post(
  "/create",
  requireAuth,
  upload.array("images", 15),
  async (req, res) => {
    // Get Request body parameters
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
      } = req.body;

      const files = req.files as Express.Multer.File[];

      if (!user_id || !make || !model || !Number(year) || !price) {
        return res.status(400).json({
          message: "user_id, make, model, year, and price are required",
        });
      }

      // Compression for images if needed
      // try {
      //   const compressedFile = await imageCompression(file, {
      //     maxSizeMB: 1
      //   });
      // } catch (error) {
      //   console.error(error);
      //   return { imageUrl: "", error: "Image compression failed" };
      // }

      // Upload images to Supabase Storage
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Insert into DB
      const [newVehicle] = await db
        .insert(vehicles)
        .values({
          user_id: Number(user_id),
          make,
          model,
          year: Number(year),
          price,
          mileage_hours: Number(mileage_hours),
          condition,
          status,
          description,
          image_url: uploadedUrls,
        })
        .returning();

      res.status(201).json({ vehicle: newVehicle });
    } catch (err) {
      console.error("Create vehicle error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/* ----------------------------------------------
   GET /api/vehicles  → Get all vehicles
------------------------------------------------ */
vehicleRouter.get("/", requireAuth, async (_req, res) => {
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
