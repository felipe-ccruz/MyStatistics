/**
 * Session resource (D1: our own /api/auth/* routes, no Better Auth client).
 * `["me"]` holds who is logged in: a `Me`, or `null` when logged out.
 */
import type { Me, SignIn, SignUp } from "@mystatistics/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, isApiRequestError, UNAUTHORIZED_ERROR } from "@/lib/api";

export const authKeys = {
  me: ["me"] as const,
};

/** GET /api/auth/me. A 401 `UNAUTHORIZED` is the answer "logged out" (`null`), not an error. */
async function fetchMe(signal: AbortSignal): Promise<Me | null> {
  try {
    return await api<Me>("/api/auth/me", { signal });
  } catch (error) {
    if (isApiRequestError(error) && error.code === UNAUTHORIZED_ERROR) return null;
    throw error;
  }
}

/** Who is logged in. `data` is `undefined` while the first check runs, then `Me` or `null`. */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => fetchMe(signal),
  });
}

/**
 * Stores the account that just signed in. Data cached for a previous session (one that
 * expired without a logout) is dropped first, so it never shows up for the new account.
 */
function useStartSession() {
  const queryClient = useQueryClient();
  return (me: Me) => {
    // Keep the ["me"] query itself: the route guards observe it and re-render on the new value.
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] });
    queryClient.setQueryData(authKeys.me, me);
  };
}

/** POST /api/auth/signup: creates the account and its private profile, already logged in. */
export function useSignUp() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (body: SignUp) => api<Me>("/api/auth/signup", { method: "POST", body }),
    onSuccess: startSession,
  });
}

/** POST /api/auth/login. */
export function useSignIn() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (body: SignIn) => api<Me>("/api/auth/login", { method: "POST", body }),
    onSuccess: startSession,
  });
}

/**
 * POST /api/auth/logout, then forgets every cached response (`queryClient.clear()`) and
 * records "logged out", so the protected route sends the user to /login without a refetch.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}
