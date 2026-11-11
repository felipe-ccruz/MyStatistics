import { ACTIVITY_CATEGORIES, type ActivityCategory } from "@mystatistics/shared/activity";
import { XP_RATE } from "@mystatistics/shared/progress";
import type { IconName } from "@/pixel/sprites/icons";

type CategoryMeta = {
  label: string;
  icon: IconName;
  /** CSS color of the category (chart series, icons). */
  color: string;
  /** Attribute the category trains (D5): study → INT, exercise → STR. */
  attribute: "INT" | "STR";
};

/** How each activity category looks in the UI. The rules behind it (rates, goals) come from @mystatistics/shared. */
export const CATEGORY_META: Record<ActivityCategory, CategoryMeta> = {
  study: { label: "Study", icon: "book", color: "var(--c1)", attribute: "INT" },
  exercise: { label: "Exercise", icon: "dumbbell", color: "var(--c2)", attribute: "STR" },
};

/** Categories in contract order, with their UI metadata. */
export const CATEGORIES = ACTIVITY_CATEGORIES.map((category) => ({ category, ...CATEGORY_META[category] }));

/** "1 XP/min", "1.2 XP/min". */
export function formatXpRate(category: ActivityCategory): string {
  return `${XP_RATE[category]} XP/min`;
}

/** XP an activity of `minutes` earns on its own: `floor(minutes × rate)` (D5). */
export function activityXp(category: ActivityCategory, minutes: number): number {
  return Math.floor(minutes * XP_RATE[category]);
}
