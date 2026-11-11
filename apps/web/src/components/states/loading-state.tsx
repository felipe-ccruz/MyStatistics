import { cn } from "@/lib/utils";

/** Pulses in two hard steps, like the rest of the pixel UI (stops under reduced motion). */
const BLOCK = "animate-[pulse_1.2s_steps(2)_infinite] rounded-md bg-off";

/** Fixed widths so the skeleton does not look like a table of equal bars. */
const ROW_WIDTHS = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-4/5"] as const;

type LoadingStateProps = {
  rows?: number;
  /** Text for screen readers. */
  label?: string;
  className?: string;
};

/**
 * Skeleton rows, placed inside a Panel like EmptyState and ErrorState, so the panel
 * keeps its own header (title, 7D/30D tabs) while the data loads.
 */
export function LoadingState({ rows = 3, label = "Loading…", className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: Math.max(1, rows) }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
          key={i}
          aria-hidden="true"
          className={cn(BLOCK, "h-2.5", ROW_WIDTHS[i % ROW_WIDTHS.length])}
        />
      ))}
    </div>
  );
}
