import { useState } from "react";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { SystemLinkPanel } from "@/components/dashboard/system-link-panel";
import { PixelButton } from "@/components/game/pixel-button";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/layout/logout-button";

/** `/` — the dashboard. Its panels (player, status, history...) arrive in Phases 5 and 7. */
export function DashboardPage() {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <AppShell showRules actions={<LogoutButton />}>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SystemLinkPanel />
        <PixelButton size="lg" icon="plus" onClick={() => setLogOpen(true)}>
          Log activity
        </PixelButton>
      </div>
      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} />
    </AppShell>
  );
}
