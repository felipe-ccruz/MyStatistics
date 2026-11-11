/** Activities resource: GET/POST /api/activities, DELETE /api/activities/:id. */
import type { Activity, CreateActivity } from "@mystatistics/shared";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { progressKeys } from "./progress";

export const activityKeys = {
  all: ["activities"] as const,
  list: ["activities", "list"] as const,
  /** GET /api/activities/summary (Phase 7); one entry per period below this prefix. */
  summary: ["activities", "summary"] as const,
};

/** Everything an activity change makes stale: the list, the period summaries and the progress (XP, quest...). */
function invalidateAfterActivityChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: activityKeys.list }),
    queryClient.invalidateQueries({ queryKey: activityKeys.summary }),
    queryClient.invalidateQueries({ queryKey: progressKeys.all }),
  ]);
}

/** The logged-in user's activities, newest first (`date` desc, then `id` desc). */
export function useActivities() {
  return useQuery({
    queryKey: activityKeys.list,
    queryFn: ({ signal }) => api<Activity[]>("/api/activities", { signal }),
  });
}

/** POST /api/activities. */
export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateActivity) => api<Activity>("/api/activities", { method: "POST", body }),
    onSuccess: () => invalidateAfterActivityChange(queryClient),
  });
}

/** DELETE /api/activities/:id. Refetches even on failure: a 404 means it is already gone. */
export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/activities/${id}`, { method: "DELETE" }),
    onSettled: () => invalidateAfterActivityChange(queryClient),
  });
}
