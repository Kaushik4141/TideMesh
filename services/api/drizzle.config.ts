import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

// Load .env.local if present, else .env
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
