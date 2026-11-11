import { Link } from "react-router";
import { paths } from "@/app/paths";
import { Bracketed } from "@/components/game/bracketed";
import { Panel } from "@/components/game/panel";
import { pixelButtonVariants } from "@/components/game/pixel-button";
import { AppShell } from "@/components/layout/app-shell";
import { PixelSprite } from "@/pixel/PixelSprite";
import { icons } from "@/pixel/sprites/icons";

/** Any unknown URL. */
export function NotFoundPage() {
  return (
    <AppShell className="flex justify-center pt-6">
      <Panel tone="quest" className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-7 items-center justify-center rounded-md border border-line2 text-acc">
            <PixelSprite sprite={icons.excl} size={16} />
          </div>
          <h1 className="font-title text-base font-normal tracking-[0.12em] text-txt uppercase text-shadow-tglow">
            <Bracketed>Not found</Bracketed>
          </h1>
          <p className="text-xs text-mut">This page does not exist in the System.</p>
          <Link to={paths.dashboard} className={pixelButtonVariants({ variant: "primary", className: "mt-2" })}>
            Back to the dashboard
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
