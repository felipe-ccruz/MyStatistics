import { cn } from "@/lib/utils";

const CORNERS = [
  "top-2 left-2 border-t-2 border-l-2",
  "top-2 right-2 border-t-2 border-r-2",
  "bottom-2 left-2 border-b-2 border-l-2",
  "bottom-2 right-2 border-b-2 border-r-2",
] as const;

/**
 * The model's corner frame (avatar box): four 14×14 corners with 2px accent borders.
 * Place it inside a `relative` box; it does not take pointer events.
 */
export function CornerFrame({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {CORNERS.map((corner) => (
        <span key={corner} className={cn("absolute size-3.5 border-acc", corner)} />
      ))}
    </div>
  );
}
