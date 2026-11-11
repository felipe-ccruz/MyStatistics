import { Panel } from "@/components/game/panel";
import { PixelButton } from "@/components/game/pixel-button";
import { PixelSprite } from "@/pixel/PixelSprite";
import { icons } from "@/pixel/sprites/icons";

/**
 * Shown by the router when a page throws while rendering, instead of a blank screen.
 * Self-contained on purpose (no header, no data): the failure may be anywhere.
 */
export function CrashPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Panel tone="quest" className="w-full max-w-sm">
        <div role="alert" className="flex flex-col items-center gap-3 text-center">
          <PixelSprite sprite={icons.excl} size={26} className="text-hp" />
          <h1 className="font-title text-base font-normal tracking-[0.12em] text-hp uppercase">[System failure]</h1>
          <p className="text-xs text-mut">Something broke while drawing this screen.</p>
          <PixelButton className="mt-2" onClick={() => window.location.reload()}>
            Reload
          </PixelButton>
        </div>
      </Panel>
    </div>
  );
}
