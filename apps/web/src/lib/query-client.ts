import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { authKeys } from "@/queries/auth";
import { isApiRequestError, NETWORK_ERROR, UNAUTHORIZED_ERROR } from "./api";

const isSessionKey = (key: readonly unknown[]) => key.length === authKeys.me.length && key[0] === authKeys.me[0];

/**
 * An `UNAUTHORIZED` anywhere means the session is gone: invalidate the `["me"]` query
 * so it refetches and reports "logged out". The redirect to /login is not done here:
 * it comes from the protected route reacting to that query.
 *
 * Only that code counts: a 401 `INVALID_CREDENTIALS` is a wrong password on the login
 * form, not a lost session.
 */
function onUnauthorized(error: unknown, failedKey?: readonly unknown[]) {
  if (!isApiRequestError(error) || error.code !== UNAUTHORIZED_ERROR) return;
  // The session query answers 401 for "logged out" itself; refetching it here would loop.
  if (failedKey && isSessionKey(failedKey)) return;
  // Several queries failing at once must not cancel the refetch the first one started.
  void queryClient.invalidateQueries({ queryKey: authKeys.me }, { cancelRefetch: false });
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => onUnauthorized(error, query.queryKey),
  }),
  mutationCache: new MutationCache({
    onError: (error) => onUnauthorized(error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Client errors (4xx) will not change on retry; a dropped connection might. One retry keeps
      // the error state from hiding behind a long spinner when the server is down.
      retry: (failureCount, error) =>
        failureCount < 1 && (!isApiRequestError(error) || error.code === NETWORK_ERROR || error.status >= 500),
    },
  },
});
