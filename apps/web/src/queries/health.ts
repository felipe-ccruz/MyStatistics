import type { HealthResponse } from "@mystatistics/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const healthKeys = {
  all: ["health"] as const,
};

/** GET /api/health. A 503 still carries a `HealthResponse` (`db: "down"`), so it is data, not an error. */
export function useHealth() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: ({ signal }) => api<HealthResponse>("/api/health", { signal, acceptStatus: [503] }),
  });
}
