import { PixelButton } from "@/components/game/pixel-button";
import { isApiRequestError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PixelSprite } from "@/pixel/PixelSprite";
import { icons } from "@/pixel/sprites/icons";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Message to show for any thrown value: the API's `message`, or a generic one. */
export function errorMessage(error: unknown): string {
  if (isApiRequestError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return FALLBACK_MESSAGE;
}

type ErrorStateProps = {
  error: unknown;
  /** Usually the query's `refetch`. Without it there is no "Try again" button. */
  onRetry?: () => void;
  /** Shows the button as busy while the retry is in flight (e.g. `query.isFetching`). */
  retrying?: boolean;
  title?: string;
  className?: string;
};

/** Failure block, placed inside a Panel: says what failed and offers a retry. Never a blank screen. */
export function ErrorState({ error, onRetry, retrying = false, title = "System error", className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-md border border-hp/50 bg-inset px-4 py-6 text-center",
        className,
      )}
    >
      <PixelSprite sprite={icons.excl} size={26} className="text-hp" />
      <p className="font-title text-sm text-hp">{title}</p>
      <p className="max-w-xs text-xs text-mut">{errorMessage(error)}</p>
      {onRetry ? (
        <PixelButton variant="outline" size="sm" className="mt-2" onClick={() => onRetry()} disabled={retrying}>
          {retrying ? "Trying…" : "Try again"}
        </PixelButton>
      ) : null}
    </div>
  );
}
