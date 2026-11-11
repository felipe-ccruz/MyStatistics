import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// O .env fica na raiz do monorepo, não dentro de apps/server.
config({ path: "../../.env" });

export default defineConfig({
  dialect: "postgresql",
  // Cada módulo declara as próprias tabelas em `<modulo>/domain/<nome>.schema.ts`.
  schema: "./src/**/*.schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
