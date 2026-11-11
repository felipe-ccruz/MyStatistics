import type { ReactNode } from "react";
import { Panel } from "@/components/game/panel";
import { cn } from "@/lib/utils";

/** Pulses in two hard steps, like the rest of the pixel UI (stops under reduced motion). */
const BLOCK = "animate-[pulse_1.2s_steps(2)_infinite] rounded-md bg-off";

/** Fixed widths so the skeleton does not look like a table of equal bars. */
const ROW_WIDTHS = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-4/5"] as const;

type LoadingStateProps = {
  /** Real panel title, when it is already known; otherwise a skeleton title. */
  title?: ReactNode;
  rows?: number;
  /** Text for screen readers. */
  label?: string;
  className?: string;
};

/** Skeleton in the shape of a dashboard panel. */
export function LoadingState({ title, rows = 3, label = "Loading…", className }: LoadingStateProps) {
  return (
    <Panel title={title} className={cn("min-w-0", className)}>
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        <span className="sr-only">{label}</span>
        {title === undefined ? <div aria-hidden="true" className={cn(BLOCK, "h-3.5 w-28")} /> : null}
        {Array.from({ length: Math.max(1, rows) }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
            key={i}
            aria-hidden="true"
            className={cn(BLOCK, "h-2.5", ROW_WIDTHS[i % ROW_WIDTHS.length])}
          />
        ))}
      </div>
    </Panel>
  );
}
