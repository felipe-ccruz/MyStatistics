import type { Activity } from "@mystatistics/shared";
import { PixelButton } from "@/components/game/pixel-button";
import { notify } from "@/components/game/system-toast";
import { errorMessage } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { activityXp, CATEGORY_META } from "@/lib/categories";
import { formatDayLabel, formatDuration } from "@/lib/dates";
import { useDeleteActivity } from "@/queries/activities";

/** "Study · 45min · Today". */
export function describeActivity(activity: Activity): string {
  const { label } = CATEGORY_META[activity.category];
  return `${label} · ${formatDuration(activity.durationMinutes)} · ${formatDayLabel(activity.date)}`;
}

type DeleteActivityDialogProps = {
  /** The activity to confirm. Kept while the dialog closes, so the text does not blank out mid-animation. */
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
};

/** Confirmation before DELETE /api/activities/:id, then a toast. */
export function DeleteActivityDialog({ activity, open, onClose }: DeleteActivityDialogProps) {
  const deleteActivity = useDeleteActivity();

  function confirm(target: Activity) {
    deleteActivity.mutate(target.id, {
      onSuccess: () => {
        onClose();
        notify.success("Activity deleted", describeActivity(target));
      },
      onError: (error) => {
        onClose();
        notify.error("Could not delete", errorMessage(error));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next || deleteActivity.isPending ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete activity</DialogTitle>
          <DialogDescription>
            {activity
              ? `${describeActivity(activity)} (+${activityXp(activity.category, activity.durationMinutes)} XP) will be removed, along with what it counted for XP, quests and streak.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <PixelButton variant="outline" className="flex-1" disabled={deleteActivity.isPending} onClick={onClose}>
            Cancel
          </PixelButton>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={activity === null || deleteActivity.isPending}
            onClick={() => (activity ? confirm(activity) : undefined)}
          >
            {deleteActivity.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
