import { typeboxResolver } from "@hookform/resolvers/typebox";
import { CreateActivity } from "@mystatistics/shared";
import type { CSSProperties } from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import { FormAlert, FormField } from "@/components/forms/form-field";
import { PixelButton } from "@/components/game/pixel-button";
import { notify } from "@/components/game/system-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATEGORIES, CATEGORY_META, formatXpRate } from "@/lib/categories";
import { formatDuration, todayISO } from "@/lib/dates";
import { fieldErrorMessage, setApiError } from "@/lib/form-errors";
import { type ExpectedReward, expectedReward, minutesOnDay, rewardTotal } from "@/lib/reward";
import { PixelSprite } from "@/pixel/PixelSprite";
import { icons } from "@/pixel/sprites/icons";
import { useActivities, useCreateActivity } from "@/queries/activities";

const PRESETS = [
  { hours: 0, minutes: 30 },
  { hours: 0, minutes: 45 },
  { hours: 1, minutes: 0 },
  { hours: 1, minutes: 30 },
] as const;

const FUTURE_DATE_MESSAGE = "The date cannot be in the future.";

const schemaResolver = typeboxResolver(CreateActivity);

/**
 * The `CreateActivity` schema the server validates, plus "no future date": the schema only
 * checks the format, and logging a day that has not happened makes no sense.
 */
const resolver: Resolver<CreateActivity> = async (values, context, options) => {
  const result = await schemaResolver(values, context, options);
  if (values.date !== undefined && values.date > todayISO()) {
    return { values: {}, errors: { ...result.errors, date: { type: "max", message: FUTURE_DATE_MESSAGE } } };
  }
  return result;
};

const emptyForm = (category: CreateActivity["category"] = "study"): CreateActivity => ({
  category,
  hours: 1,
  minutes: 0,
  date: undefined,
});

/** "+54 XP in STR · +40 daily quest · +100 full clear". */
function rewardText(reward: ExpectedReward, attribute: string): string {
  const parts = [`+${reward.xp} XP in ${attribute}`];
  if (reward.questReward > 0) parts.push(`+${reward.questReward} daily quest`);
  if (reward.fullClearBonus > 0) parts.push(`+${reward.fullClearBonus} full clear`);
  return parts.join(" · ");
}

/** Whole minutes typed in the form; anything invalid counts as 0 for the preview. */
function typedMinutes(hours: number, minutes: number): number {
  const h = Number.isInteger(hours) && hours > 0 ? hours : 0;
  const m = Number.isInteger(minutes) && minutes > 0 ? minutes : 0;
  return h * 60 + m;
}

type LogActivityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The model's "[LOG ACTIVITY]" window: category, duration, optional date and the expected reward. */
export function LogActivityDialog({ open, onOpenChange }: LogActivityDialogProps) {
  const activities = useActivities();
  const createActivity = useCreateActivity();
  const form = useForm<CreateActivity>({ resolver, defaultValues: emptyForm() });
  const { errors, isSubmitting } = form.formState;
  const values = useWatch({ control: form.control });

  const today = todayISO();
  const category = values.category ?? "study";
  const meta = CATEGORY_META[category];
  const minutes = typedMinutes(values.hours ?? 0, values.minutes ?? 0);
  // Without the list (still loading, or failed) the preview only knows this activity's own XP.
  const day = minutesOnDay(activities.data ?? [], values.date || today);
  const reward = expectedReward(day, category, minutes);

  function changeOpen(next: boolean) {
    // Closing forgets what was typed (and any error), keeping the last category like the model.
    if (!next) form.reset(emptyForm(form.getValues("category")));
    onOpenChange(next);
  }

  const onSubmit = form.handleSubmit(async (body) => {
    // Computed before the list refetches: afterwards the new activity would already count.
    const loggedMinutes = body.hours * 60 + body.minutes;
    const gained = rewardTotal(expectedReward(day, body.category, loggedMinutes));
    const loggedMeta = CATEGORY_META[body.category];
    try {
      await createActivity.mutateAsync(body);
    } catch (error) {
      // INVALID_DURATION, VALIDATION and anything else, inside the dialog.
      setApiError(form, error);
      return;
    }
    changeOpen(false);
    notify.success(`+${gained} XP · ${loggedMeta.attribute}`, `${loggedMeta.label} · ${formatDuration(loggedMinutes)}`);
  });

  const setPreset = (preset: (typeof PRESETS)[number]) => {
    const shouldValidate = form.formState.isSubmitted;
    form.setValue("hours", preset.hours, { shouldValidate });
    form.setValue("minutes", preset.minutes, { shouldValidate });
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
          <DialogDescription>Time spent on a category, on a day. XP and quests follow from it.</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-xs text-mut">Category</legend>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((option) => (
                <label
                  key={option.category}
                  style={{ "--cat": option.color } as CSSProperties}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border border-line bg-transparent px-1.5 py-3 text-txt transition-colors hover:border-line2 has-checked:border-[var(--cat)] has-checked:bg-inset has-focus-visible:ring-2 has-focus-visible:ring-acc/50"
                >
                  <input type="radio" value={option.category} className="sr-only" {...form.register("category")} />
                  <PixelSprite sprite={icons[option.icon]} size={22} className="text-[var(--cat)]" />
                  <span className="text-[13px] font-medium">{option.label}</span>
                  <span className="font-mono text-[10px] text-mut">{formatXpRate(option.category)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <div className="flex gap-2.5">
              <FormField
                label="Hours"
                className="flex-1"
                error={fieldErrorMessage(errors.hours, "Use a whole number, 0 or more.")}
              >
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    className="font-mono text-base"
                    {...form.register("hours", { valueAsNumber: true })}
                  />
                )}
              </FormField>
              <FormField
                label="Minutes"
                className="flex-1"
                error={fieldErrorMessage(errors.minutes, "Use a whole number from 0 to 59.")}
              >
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    step={5}
                    className="font-mono text-base"
                    {...form.register("minutes", { valueAsNumber: true })}
                  />
                )}
              </FormField>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={`${preset.hours}:${preset.minutes}`}
                  type="button"
                  onClick={() => setPreset(preset)}
                  className="cursor-pointer rounded-md border border-line bg-transparent px-2.5 py-1 font-mono text-[11px] whitespace-nowrap text-mut transition-colors outline-none hover:border-line2 hover:text-acc focus-visible:ring-2 focus-visible:ring-acc/50"
                >
                  {formatDuration(preset.hours * 60 + preset.minutes)}
                </button>
              ))}
            </div>
          </div>

          <FormField
            label={
              <>
                Date <span className="text-dim">(optional — defaults to today)</span>
              </>
            }
            error={fieldErrorMessage(errors.date, FUTURE_DATE_MESSAGE)}
          >
            {(control) => (
              <Input
                {...control}
                type="date"
                max={today}
                className="font-mono [color-scheme:dark]"
                {...form.register("date", { setValueAs: (value: string) => (value === "" ? undefined : value) })}
              />
            )}
          </FormField>

          <p
            aria-live="polite"
            className="m-0 rounded-md border border-line2 border-dashed bg-inset px-3 py-2.5 text-[13px] text-mut"
          >
            Expected reward: <span className="font-title text-acc">{rewardText(reward, meta.attribute)}</span>
          </p>

          <FormAlert message={errors.root?.server?.message} />

          <div className="flex gap-2.5">
            <PixelButton variant="outline" size="lg" className="flex-1" onClick={() => changeOpen(false)}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" size="lg" className="flex-[2]" disabled={isSubmitting}>
              {isSubmitting ? "Logging…" : "Log"}
            </PixelButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
