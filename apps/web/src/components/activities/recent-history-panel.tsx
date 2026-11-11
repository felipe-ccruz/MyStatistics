import type { Activity } from "@mystatistics/shared";
import { useState } from "react";
import { Panel } from "@/components/game/panel";
import { PixelButton } from "@/components/game/pixel-button";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { activityXp, CATEGORY_META } from "@/lib/categories";
import { formatDayLabel, formatDuration } from "@/lib/dates";
import { PixelSprite } from "@/pixel/PixelSprite";
import { icons } from "@/pixel/sprites/icons";
import { useActivities } from "@/queries/activities";
import { DeleteActivityDialog, describeActivity } from "./delete-activity-dialog";

const TITLE = "Recent history";
/** How many of the newest activities the panel lists (the model shows 6). */
const VISIBLE = 6;

function HistoryRow({ activity, onDelete }: { activity: Activity; onDelete: () => void }) {
  const meta = CATEGORY_META[activity.category];

  return (
    <li className="flex items-center gap-2.5 border-line border-b py-2">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-inset"
        style={{ color: meta.color }}
      >
        <PixelSprite sprite={icons[meta.icon]} size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{meta.label}</div>
        <div className="text-xs text-mut">
          {formatDayLabel(activity.date)} · {meta.attribute}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[13px] tabular-nums">{formatDuration(activity.durationMinutes)}</div>
        <div className="font-title text-[11px]" style={{ color: meta.color }}>
          +{activityXp(activity.category, activity.durationMinutes)} XP
        </div>
      </div>
      <PixelButton
        variant="ghost"
        size="icon"
        aria-label={`Delete ${describeActivity(activity)}`}
        title="Delete activity"
        onClick={onDelete}
      >
        <PixelSprite sprite={icons.x} size={10} />
      </PixelButton>
    </li>
  );
}

type RecentHistoryPanelProps = {
  /** Opens the "Log activity" dialog. */
  onLogActivity: () => void;
};

type HistoryContentProps = RecentHistoryPanelProps & {
  onDelete: (activity: Activity) => void;
};

/** The panel body for each state of the query: loading, error, empty, or the list. */
function HistoryContent({ onLogActivity, onDelete }: HistoryContentProps) {
  const activities = useActivities();

  const logButton = (
    <PixelButton size="lg" icon="plus" block className="mt-3.5" onClick={onLogActivity}>
      Log activity
    </PixelButton>
  );

  if (activities.isPending) {
    return (
      <>
        <LoadingState rows={4} label="Loading your activities…" />
        {logButton}
      </>
    );
  }

  if (activities.isError) {
    return (
      <>
        <ErrorState
          title="Could not load your activities"
          error={activities.error}
          onRetry={() => void activities.refetch()}
          retrying={activities.isFetching}
        />
        {logButton}
      </>
    );
  }

  const all = activities.data;
  if (all.length === 0) {
    return (
      <EmptyState
        icon="book"
        title="No activity yet"
        description="Log your first one to start earning XP."
        action={
          <PixelButton icon="plus" onClick={onLogActivity}>
            Log activity
          </PixelButton>
        }
      />
    );
  }

  // The API already sorts by date desc, then id desc.
  const visible = all.slice(0, VISIBLE);

  return (
    <>
      <ul className="m-0 list-none p-0">
        {visible.map((activity) => (
          <HistoryRow key={activity.id} activity={activity} onDelete={() => onDelete(activity)} />
        ))}
      </ul>
      {all.length > visible.length ? (
        <p className="mt-2 text-[11px] text-dim">
          Latest {visible.length} of {all.length} activities.
        </p>
      ) : null}
      {logButton}
    </>
  );
}

/** The model's "Recent history": newest activities from GET /api/activities, with delete and the log button. */
export function RecentHistoryPanel({ onLogActivity }: RecentHistoryPanelProps) {
  const [toDelete, setToDelete] = useState<Activity | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Panel title={TITLE}>
      <HistoryContent
        onLogActivity={onLogActivity}
        onDelete={(activity) => {
          setToDelete(activity);
          setConfirmOpen(true);
        }}
      />
      {/* Outside the list: deleting the last activity empties the panel, and the dialog must stay mounted for its toast. */}
      <DeleteActivityDialog activity={toDelete} open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </Panel>
  );
}
