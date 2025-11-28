import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: "./src/migrations", 
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgres://powerbidz:powerbidzpassword@localhost:5432/powerbidz_db",
  },
});