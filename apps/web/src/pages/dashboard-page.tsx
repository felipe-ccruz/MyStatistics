import { SystemLinkPanel } from "@/components/dashboard/system-link-panel";
import { AppShell } from "@/components/layout/app-shell";

/** `/` — the dashboard. Its panels (player, status, history...) arrive in Phases 5 and 7. */
export function DashboardPage() {
  return (
    <AppShell showRules>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SystemLinkPanel />
      </div>
    </AppShell>
  );
}
