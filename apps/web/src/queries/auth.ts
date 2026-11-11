/**
 * Session resource. The `["me"]` query (GET /api/auth/me) and the sign up /
 * sign in / sign out mutations arrive in T4.1; the key lives here already so
 * the global 401 handling in lib/query-client.ts can target it.
 */
export const authKeys = {
  me: ["me"] as const,
};
