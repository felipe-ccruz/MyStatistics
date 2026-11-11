import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** 0–100 share of `value` in `max`, never NaN (non-finite or non-positive max → 0). */
export function toPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

const trackVariants = cva("rounded-md border border-line bg-inset p-[2px]", {
  variants: {
    size: {
      sm: "h-2",
      md: "h-3",
    },
  },
  defaultVariants: { size: "md" },
});

type SegmentedBarProps = VariantProps<typeof trackVariants> & {
  value: number;
  max?: number;
  /** CSS color for the fill, e.g. "var(--c1)". Defaults to the theme accent. */
  color?: string;
  /**
   * "fill": one bar cut into blocks by a gradient, growing in 12 steps (XP bar).
   * "blocks": separate glowing segments (status bars).
   */
  variant?: "fill" | "blocks";
  /** Number of blocks in the "blocks" variant. */
  segments?: number;
  /** Accessible name of the progress bar. */
  label: string;
  className?: string;
};

/** Progress bar from the model, with no image: blocks are a repeating gradient or separate segments. */
export function SegmentedBar({
  value,
  max = 100,
  color = "var(--acc)",
  variant = "fill",
  segments = 12,
  size,
  label,
  className,
}: SegmentedBarProps) {
  const percent = toPercent(value, max);
  const a11y = {
    role: "progressbar",
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(percent),
  } as const;

  if (variant === "blocks") {
    const count = Math.max(1, Math.round(segments));
    const lit = Math.round((percent / 100) * count);
    return (
      <div {...a11y} className={cn("flex gap-[3px]", className)}>
        {Array.from({ length: count }, (_, i) => {
          const on = i < lit;
          const style: CSSProperties = on ? { background: color, boxShadow: `0 0 6px ${color}` } : {};
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length list of identical segments
            <div key={i} className={cn("h-2.5 flex-1 rounded-[1px]", on ? "" : "bg-off")} style={style} />
          );
        })}
      </div>
    );
  }

  return (
    <div {...a11y} className={cn(trackVariants({ size }), className)}>
      <div
        className="h-full bg-[repeating-linear-gradient(90deg,transparent_0_6px,rgba(0,0,0,0.35)_6px_8px)] shadow-[var(--tglow)] transition-[width] duration-600 ease-[steps(12)]"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}
