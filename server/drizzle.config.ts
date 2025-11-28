import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config();

import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: "./src/migrations", 
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});