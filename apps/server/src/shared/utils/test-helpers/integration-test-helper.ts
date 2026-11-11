import path from "node:path";
import type { SignUp } from "@mystatistics/shared";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { signUpUseCase } from "@/auth/application/sign-up.usecase";
import { db } from "@/shared/infra/databases/postgres";
import { env } from "@/shared/infra/env/env";

const MIGRATIONS_FOLDER = path.resolve(import.meta.dir, "../../../../drizzle");

let setup: Promise<void> | undefined;
let testUserCount = 0;

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

  /**
   * Esvazia TODAS as tabelas do schema `public` (usuários, sessões, perfis, atividades…).
   * Lê a lista do catálogo, então tabela nova entra sozinha. Use no `afterEach` de teste que
   * cria usuários.
   */
  static async truncateAll(): Promise<void> {
    assertTestDatabase();
    const rows = await db.execute<{ tablename: string }>(
      sql`select tablename from pg_tables where schemaname = 'public'`,
    );
    if (rows.length === 0) return;
    const tables = sql.join(
      rows.map((row) => sql.identifier(row.tablename)),
      sql`, `,
    );
    await db.execute(sql`truncate table ${tables} restart identity cascade`);
  }

  /**
   * Espera a promise falhar e devolve o erro, para conferir com `expect(erro).toMatchObject(...)`.
   *
   * Use no lugar de `await expect(promise).rejects`: no Bun 1.3, depois que o Better Auth roda
   * no processo (ele usa AsyncLocalStorage), o `.rejects` sobre uma promise que ainda faz query
   * nunca resolve — o teste estoura o tempo e a conexão do pool fica presa no meio da query.
   */
  static async rejectionOf(promise: Promise<unknown>): Promise<unknown> {
    try {
      await promise;
    } catch (error) {
      return error;
    }
    throw new Error("Expected the promise to reject, but it resolved.");
  }

  /**
   * Cria um usuário de verdade pelo cadastro (usuário + perfil `private` + sessão) e devolve o
   * cookie de sessão pronto para mandar no header `cookie`. E-mail e slug são únicos por chamada.
   */
  static async createTestUser(overrides: Partial<SignUp> = {}): Promise<TestUser> {
    testUserCount += 1;
    const input: SignUp = {
      email: `user${testUserCount}@test.local`,
      password: "test-password-123",
      slug: `user-${testUserCount}`,
      ...overrides,
    };

    const { me, setCookies } = await signUpUseCase(input);
    // "nome=valor; Path=/; HttpOnly…" → "nome=valor", que é o que o navegador manda de volta.
    const cookie = setCookies.map((setCookie) => setCookie.split(";")[0]).join("; ");

    return {
      id: me.user.id,
      email: me.user.email,
      slug: me.profile.slug,
      password: input.password,
      cookie,
      headers: new Headers({ cookie }),
    };
  }
}

/** Usuário criado por `IntegrationTestHelper.createTestUser`. */
export type TestUser = {
  id: string;
  email: string;
  slug: string;
  password: string;
  /** Valor do header `cookie` com a sessão do usuário. */
  cookie: string;
  /** Headers com o `cookie` já preenchido, para passar a `auth.api.*` ou aos use cases. */
  headers: Headers;
};
