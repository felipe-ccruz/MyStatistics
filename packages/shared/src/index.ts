/**
 * Contratos de API compartilhados entre apps/web e apps/server.
 * Toda rota nova deve ter seu tipo de request/response declarado aqui.
 */

export type HealthResponse = {
  status: "ok" | "degraded";
  db: "ok" | "down";
};

export type HelloResponse = {
  message: string;
  method: string;
};

export type { Activity, ActivityCategory } from "./activity";
export { ACTIVITY_CATEGORIES } from "./activity";
export { CreateActivity, UpdateActivity } from "./activity-schema";
export type { ActivitySummary, SummaryPeriod } from "./activity-summary";
export { ActivitySummaryQuery, SUMMARY_PERIODS } from "./activity-summary";
export type { Me, ProfileVisibility } from "./auth";
export { PROFILE_VISIBILITIES, SLUG_PATTERN } from "./auth";
export { SignIn, SignUp } from "./auth-schema";
export type { ApiError } from "./error";
export type { Entry, Metric } from "./metric";
export { CreateEntry, CreateMetric } from "./metric-schema";
export type { MetricSummary, MetricSummaryPeriod } from "./metric-summary";
export { METRIC_SUMMARY_PERIODS, MetricSummaryQuery } from "./metric-summary";
export type { Profile, ProfileItem, ProfileItemKind, PublicProfile } from "./profile";
export { PROFILE_ITEM_KINDS } from "./profile";
export { UpdateProfile, UpdateProfileItem } from "./profile-schema";
export type { ClassName, DailyQuestGoal, Progress, Rank } from "./progress";
export {
  CLASS_NAMES,
  DAILY_GOAL_MINUTES,
  DAILY_GOAL_REWARD,
  FOCUS_SESSION_MINUTES,
  FULL_CLEAR_BONUS,
  RANK_MIN_LEVEL,
  RANKS,
  XP_RATE,
  xpToNextLevel,
} from "./progress";
