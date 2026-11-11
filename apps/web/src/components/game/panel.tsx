import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CornerFrame } from "./corner-frame";

const panelVariants = cva("relative rounded-md border p-4 text-txt", {
  variants: {
    tone: {
      /** Regular dashboard card. */
      default: "border-line bg-card shadow-glow",
      /** Highlighted "system window" (daily quest, dialogs). */
      quest: "border-line2 bg-card2 qbg shadow-glow2",
    },
  },
  defaultVariants: { tone: "default" },
});

const panelTitleVariants = cva("flex items-center gap-2 font-title font-normal uppercase", {
  variants: {
    variant: {
      /** Accent title with the square bullet ("STATUS", "ATTRIBUTES"). */
      accent: "text-sm tracking-ls text-acc text-shadow-tglow",
      /** Small muted title ("STREAK"). */
      muted: "text-xs tracking-ls text-mut",
    },
  },
  defaultVariants: { variant: "accent" },
});

type PanelProps = VariantProps<typeof panelVariants> &
  VariantProps<typeof panelTitleVariants> & {
    title?: ReactNode;
    /** Right side of the header: a badge, a legend, period tabs... */
    aside?: ReactNode;
    /** Draws the model's accent corner frame. */
    framed?: boolean;
    className?: string;
    children?: ReactNode;
  };

/** Dashboard card in the model's style, with a pixel-font title. */
export function Panel({ title, aside, tone, variant, framed = false, className, children }: PanelProps) {
  const hasHeader = title !== undefined || aside !== undefined;

  return (
    <section className={cn(panelVariants({ tone }), className)}>
      {framed ? <CornerFrame /> : null}
      {hasHeader ? (
        <header className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          {title !== undefined ? (
            <h2 className={panelTitleVariants({ variant })}>
              {variant === "muted" ? null : <span aria-hidden="true" className="size-1.5 shrink-0 bg-acc" />}
              {title}
            </h2>
          ) : (
            <span />
          )}
          {aside}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** The small mono pill on a panel header ("today", "30-day average"). */
export function PanelBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-mut",
        className,
      )}
    >
      {children}
    </span>
  );
}
