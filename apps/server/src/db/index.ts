import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, { max: env.isProduction ? 10 : 1 });

export const db = drizzle(client, { schema });

/** Usado pelo /api/health: confirma que o Postgres está de pé e alcançável. */
export async function pingDb(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
