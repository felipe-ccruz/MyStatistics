import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// O .env fica na raiz do monorepo, não dentro de apps/server.
config({ path: "../../.env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Missing DATABASE_URL. Copy .env.example to .env at the repo root.");

export default defineConfig({
  dialect: "postgresql",
  // Cada módulo declara as próprias tabelas em `<modulo>/domain/<nome>.schema.ts`.
  schema: "./src/**/*.schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
