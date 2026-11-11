import { toast } from "sonner";
import { Bracketed } from "@/components/game/bracketed";
import { cn } from "@/lib/utils";

const DURATION = { success: 2900, error: 5000 } as const;

type Tone = keyof typeof DURATION;

type SystemToastProps = {
  title: string;
  description?: string;
  tone: Tone;
};

/**
 * The model's "[ SYSTEM ]" toast. Its own toastIn animation runs for the same time
 * Sonner keeps it on screen, and both pause while the pointer is over it.
 */
function SystemToast({ title, description, tone }: SystemToastProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-[280px] animate-toast-in rounded-md border bg-card2 px-5 py-3 text-center shadow-glow2 hover:[animation-play-state:paused]",
        tone === "error" ? "border-hp" : "border-line2",
      )}
      style={{ animationDuration: `${DURATION[tone]}ms` }}
    >
      <div className={cn("font-title text-[11px] tracking-[0.16em]", tone === "error" ? "text-hp" : "text-acc")}>
        <Bracketed spaced>SYSTEM</Bracketed>
      </div>
      <div className="mt-1 font-title text-xl text-txt text-shadow-tglow">{title}</div>
      {description ? <div className="mt-1 text-xs text-mut">{description}</div> : null}
    </div>
  );
}

function show(tone: Tone, title: string, description?: string) {
  return toast.custom(() => <SystemToast tone={tone} title={title} description={description} />, {
    duration: DURATION[tone],
  });
}

/** Feedback toasts for mutations: `notify.success("+45 XP · INT", "Study · 45min")`. */
export const notify = {
  success: (title: string, description?: string) => show("success", title, description),
  error: (title: string, description?: string) => show("error", title, description),
};
