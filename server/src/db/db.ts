// server/src/db/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// console.log("Database connected successfully", process.env.DATABASE_URL);
// Drizzle ORM client
export const db = drizzle(pool);

// Optional: raw query helper if you still want it
export const query = (text: string, params?: any[]) => pool.query(text, params);
