import { format } from "date-fns";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { paths } from "@/app/paths";
import { PixelSprite } from "@/pixel/PixelSprite";
import { icons } from "@/pixel/sprites/icons";
import { SystemRulesDialog } from "./system-rules-dialog";
import { ThemePicker } from "./theme-picker";

type AppHeaderProps = {
  /** Shows the "System rules" button (dashboard). */
  showRules?: boolean;
  /** Extra buttons at the end of the header: the logout button goes here (T4.2). */
  actions?: ReactNode;
};

/** The model's dashboard header: brand, system date, theme picker and rules. */
export function AppHeader({ showRules = false, actions }: AppHeaderProps) {
  const today = format(new Date(), "EEE, d MMM yyyy");

  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-card2 px-4 py-3 shadow-glow">
      <Link to={paths.dashboard} className="flex items-center gap-3 text-txt no-underline hover:text-txt">
        <PixelSprite sprite={icons.crystal} size={26} className="text-acc rglow" />
        <div>
          <div className="font-title text-xl tracking-ls text-txt">MyStatistics</div>
          <div className="font-mono text-[11px] text-mut uppercase">System v0.1 · {today}</div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2.5">
        <ThemePicker />
        {showRules ? <SystemRulesDialog /> : null}
        {actions}
      </div>
    </header>
  );
}
