import { useState } from "react";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { RecentHistoryPanel } from "@/components/activities/recent-history-panel";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/layout/logout-button";

/**
 * `/` — the dashboard, laid out like the model: three columns that wrap on small screens.
 * Phase 7 fills the first two ("Sheet": player card, status, streak · "Stats": attributes,
 * time per day, period summary) and puts the daily quest on top of the "Quests" column.
 */
export function DashboardPage() {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <AppShell showRules actions={<LogoutButton />}>
      <div className="flex flex-wrap items-start gap-4">
        {/* Phase 7: <section aria-label="Sheet" className="flex min-w-0 flex-[1_1_280px] flex-col gap-4"> */}
        {/* Phase 7: <section aria-label="Stats" className="flex min-w-0 flex-[2.2_1_440px] flex-col gap-4"> */}
        {/* Alone for now, so capped and centered; Phase 7 drops `mx-auto max-w-xl`. */}
        <section aria-label="Quests" className="mx-auto flex w-full min-w-0 max-w-xl flex-[1.2_1_300px] flex-col gap-4">
          <RecentHistoryPanel onLogActivity={() => setLogOpen(true)} />
        </section>
      </div>
      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} />
    </AppShell>
  );
}
