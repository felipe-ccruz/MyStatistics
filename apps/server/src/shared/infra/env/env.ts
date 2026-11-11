/**
 * Variáveis de ambiente vêm do .env da raiz (ver .env.example).
 * Falhar aqui, na subida, é melhor do que descobrir a env faltando no meio de uma query.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}. Copie o .env.example para .env na raiz do projeto.`);
  }
  return value;
}

/** Segredo que assina os cookies de sessão do Better Auth. Curto demais é fácil de quebrar. */
function secret(name: string, minLength: number): string {
  const value = required(name);
  if (value.length < minLength) {
    throw new Error(`${name} precisa ter pelo menos ${minLength} caracteres (gere com \`openssl rand -base64 32\`).`);
  }
  return value;
}

function url(name: string): string {
  const value = required(name);
  if (!URL.canParse(value)) {
    throw new Error(`${name} precisa ser uma URL completa (ex.: http://localhost:5173). Recebido: "${value}".`);
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? 3333),
  BETTER_AUTH_SECRET: secret("BETTER_AUTH_SECRET", 32),
  /** Origem que o navegador usa (o front, por causa do proxy do Vite). */
  BETTER_AUTH_URL: url("BETTER_AUTH_URL"),
  isProduction: process.env.NODE_ENV === "production",
};
