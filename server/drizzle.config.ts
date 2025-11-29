// server/drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use the single DATABASE_URL env variable
    url:
      process.env.DATABASE_URL ||
      "postgres://powerbidz:powerbidzpassword@db:5432/powerbidz_db",
  },
});
