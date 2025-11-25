import { Router } from "express";
import { query } from "../db";

const vehicleRouter = Router();

// POST /api/vehicles
vehicleRouter.post("/", async (req, res) => {
  try {
    const {seller_id, seller_type, dealership_name, make, model, year, color, mileage, engine_type, transmission, fuel_type, price, city, province,
    } = req.body;

    // validation
    if (!seller_id || !seller_type || !make || !model) {
      return res.status(400).json({
        message: "seller_id, seller_type, make, and model are required",
      });
    }

    const result = await query(
      `INSERT INTO vehicles ( seller_id, seller_type, dealership_name, make, model, year, color, mileage, engine_type, transmission, fuel_type, price, city, province)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [seller_id, seller_type, dealership_name || null, make, model, year || null, color || null, mileage || null, engine_type || null, transmission || null, fuel_type || null, price || null, city || null, province || null,]
    );

    const vehicle = result.rows[0];
    res.status(201).json({ vehicle });
  } catch (err) {
    console.error("Create vehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/vehicles  → Search / filter vehicles
vehicleRouter.get("/", async (req, res) => {
  try {
    const {make, year, min_year, max_year, min_mileage, max_mileage, min_price, max_price, seller_type, city
    } = req.query;

    // Start base SQL
    let sql = "SELECT * FROM vehicles WHERE 1=1";
    const params: any[] = [];

    // filters
    if (make) {
      params.push(make);
      sql += ` AND make = $${params.length}`;
    }

    if (year) {
      params.push(Number(year));
      sql += ` AND year = $${params.length}`;
    }

    if (min_year) {
      params.push(Number(min_year));
      sql += ` AND year >= $${params.length}`;
    }

    if (max_year) {
      params.push(Number(max_year));
      sql += ` AND year <= $${params.length}`;
    }

    if (min_mileage) {
      params.push(Number(min_mileage));
      sql += ` AND mileage >= $${params.length}`;
    }

    if (max_mileage) {
      params.push(Number(max_mileage));
      sql += ` AND mileage <= $${params.length}`;
    }

    if (min_price) {
      params.push(Number(min_price));
      sql += ` AND price >= $${params.length}`;
    }

    if (max_price) {
      params.push(Number(max_price));
      sql += ` AND price <= $${params.length}`;
    }

    if (seller_type) {
      params.push(seller_type);
      sql += ` AND seller_type = $${params.length}`;
    }

    if (city) {
      params.push(city);
      sql += ` AND city = $${params.length}`;
    }

    // Execute final SQL
    const result = await query(sql, params);
    res.json({ vehicles: result.rows });
  } catch (err) {
    console.error("Vehicle search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default vehicleRouter;
