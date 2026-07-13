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

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? 3333),
  isProduction: process.env.NODE_ENV === "production",
};
