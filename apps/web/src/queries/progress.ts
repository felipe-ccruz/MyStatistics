/**
 * Progress resource (GET /api/progress, Phase 7). Only the key for now, so the
 * activity mutations can already invalidate it.
 */
export const progressKeys = {
  all: ["progress"] as const,
};
