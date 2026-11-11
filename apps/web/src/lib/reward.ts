import type { Activity } from "@mystatistics/shared";
import { ACTIVITY_CATEGORIES, type ActivityCategory } from "@mystatistics/shared/activity";
import { DAILY_GOAL_MINUTES, DAILY_GOAL_REWARD, FULL_CLEAR_BONUS, XP_RATE } from "@mystatistics/shared/progress";

export type DayMinutes = Record<ActivityCategory, number>;

/** Minutes already logged on `day`, per category. */
export function minutesOnDay(activities: readonly Activity[], day: string): DayMinutes {
  const minutes: DayMinutes = { study: 0, exercise: 0 };
  for (const activity of activities) {
    if (activity.date === day) minutes[activity.category] += activity.durationMinutes;
  }
  return minutes;
}

export type ExpectedReward = {
  /** XP the day gains: XP is `floor(minutes × rate)` per day and category, so it is the difference. */
  xp: number;
  /** Daily quest reward, when this activity is the one that reaches the category's goal. */
  questReward: number;
  /** Full clear bonus, when it also completes the last goal of the day. */
  fullClearBonus: number;
};

/**
 * Preview of what logging `minutes` of `category` on a day gives, by the D5 rules in
 * @mystatistics/shared. The real values come from the server (GET /api/progress).
 */
export function expectedReward(day: DayMinutes, category: ActivityCategory, minutes: number): ExpectedReward {
  const added = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
  const before = day[category];
  const after = before + added;
  const rate = XP_RATE[category];
  const goal = DAILY_GOAL_MINUTES[category];

  const reachesGoal = added > 0 && before < goal && after >= goal;
  const othersDone = ACTIVITY_CATEGORIES.every((c) => c === category || day[c] >= DAILY_GOAL_MINUTES[c]);

  return {
    xp: Math.floor(after * rate) - Math.floor(before * rate),
    questReward: reachesGoal ? DAILY_GOAL_REWARD[category] : 0,
    fullClearBonus: reachesGoal && othersDone ? FULL_CLEAR_BONUS : 0,
  };
}

/** Total of a preview. */
export function rewardTotal(reward: ExpectedReward): number {
  return reward.xp + reward.questReward + reward.fullClearBonus;
}
