import path from "node:path";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "@/shared/infra/databases/postgres";
import { env } from "@/shared/infra/env/env";

const MIGRATIONS_FOLDER = path.resolve(import.meta.dir, "../../../../drizzle");

let setup: Promise<void> | undefined;

/** Trava de segurança: o reset apaga o schema inteiro, então só roda num banco `*_test`. */
function assertTestDatabase(): void {
  const name = new URL(env.DATABASE_URL).pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(
      `Testes de integração só rodam num banco *_test (recebido: "${name}"). ` +
        "Rode pelo script de teste do server, que carrega o .env.test.",
    );
  }
}

async function resetDatabase(): Promise<void> {
  assertTestDatabase();
  // Sem isso, cada "drop ... if exists" e "create ... if not exists" imprime um NOTICE no meio dos testes.
  await db.execute(sql`set client_min_messages = warning`);
  await db.execute(sql`drop schema if exists drizzle cascade`);
  await db.execute(sql`drop schema if exists public cascade`);
  await db.execute(sql`create schema public`);
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

export class IntegrationTestHelper {
  /**
   * Recria o banco de teste do zero e aplica as migrações versionadas — o mesmo caminho da produção.
   * Roda uma vez por `bun test` (os arquivos de teste dividem o processo): DDL depois das
   * primeiras queries invalidaria os prepared statements já em cache.
   */
  static setupTestDatabase(): Promise<void> {
    setup ??= resetDatabase();
    return setup;
  }

  /** Esvazia as tabelas e zera os ids. Use no `afterEach` para cada teste começar do zero. */
  static async truncate(...tables: PgTable[]): Promise<void> {
    for (const table of tables) {
      await db.execute(sql`truncate table ${table} restart identity cascade`);
    }
  }
}
