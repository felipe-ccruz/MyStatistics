import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { env } from "@/shared/infra/env/env";

const client = postgres(env.DATABASE_URL, { max: env.isProduction ? 10 : 1 });

export const db = drizzle(client);

/**
 * Transação do Drizzle. Todo método de repositório aceita um `tx` opcional como último
 * parâmetro, para o use case rodar várias queries na mesma transação.
 * Dentro de `db.transaction`, passe SEMPRE o `tx`: fora de produção o pool tem 1 conexão,
 * e uma query pelo `db` ficaria esperando a conexão que a própria transação está usando.
 */
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Usado pelo /api/health: confirma que o Postgres está de pé e alcançável. */
export async function pingDb(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
