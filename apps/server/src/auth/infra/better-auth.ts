import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/shared/infra/databases/postgres";
import { env } from "@/shared/infra/env/env";
import { authSchema } from "../domain/auth.schema";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

/**
 * Instância do Better Auth: cuida do hash da senha, das sessões e do cookie, gravando nas
 * tabelas de `auth.schema.ts` pelo `db` do projeto.
 *
 * O handler HTTP da lib NÃO é montado: as rotas `/api/auth/*` são as nossas (auth.controller.ts),
 * que chamam `auth.api.*` e repassam o `Set-Cookie`. Assim toda falha sai no `ApiError`.
 *
 * Cuidado: o `drizzleAdapter` usa o `db` global. Fora de produção o pool tem 1 conexão, então
 * nunca chame `auth.api.*` de dentro de um `db.transaction` nosso — a chamada ficaria esperando
 * a conexão que a própria transação está segurando.
 */
export const auth = betterAuth({
  appName: "MyStatistics",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema, usePlural: true }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: THIRTY_DAYS_IN_SECONDS,
    // Sessão usada depois de 1 dia é renovada por mais 30 (o guard repassa o cookie novo).
    updateAge: ONE_DAY_IN_SECONDS,
  },
  // O navegador chega pelo proxy do Vite, então a origem é a do front.
  trustedOrigins: [env.BETTER_AUTH_URL],
  advanced: {
    useSecureCookies: env.isProduction,
  },
  telemetry: { enabled: false },
  // Nos testes, os avisos esperados ("User not found", e-mail repetido) só poluiriam a saída.
  logger: { level: process.env.NODE_ENV === "test" ? "error" : "warn" },
});
