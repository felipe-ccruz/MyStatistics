import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// O .env fica na raiz do monorepo, não dentro de apps/server.
config({ path: "../../.env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
