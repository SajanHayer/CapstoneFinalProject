// server/src/db/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config();

// Postgres connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Drizzle ORM client
export const db = drizzle(pool);

// Optional: raw query helper if you still want it
export const query = (text: string, params?: any[]) => pool.query(text, params);
