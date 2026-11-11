import { Panel } from "@/components/game/panel";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";

type SessionScreenProps =
  | { status: "loading" }
  | {
      /** The session check failed (not a "logged out" answer): server down, network... */
      status: "error";
      error: unknown;
      onRetry: () => void;
      retrying: boolean;
    };

/**
 * Full-screen state shown while the app does not know yet who is logged in
 * (loading), or could not find out (error). Never a blank page.
 */
export function SessionScreen(props: SessionScreenProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Panel tone="quest" title="System link" className="w-full max-w-sm">
        {props.status === "loading" ? (
          <LoadingState rows={3} label="Checking your session…" />
        ) : (
          <ErrorState
            title="Could not check your session"
            error={props.error}
            onRetry={props.onRetry}
            retrying={props.retrying}
          />
        )}
      </Panel>
    </div>
  );
}
