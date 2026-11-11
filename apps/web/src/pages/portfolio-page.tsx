import { useParams } from "react-router";
import { Panel } from "@/components/game/panel";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

/** `/u/:slug` — public portfolio. Shell only; the read-only panels arrive in T11.3. */
export function PortfolioPage() {
  const { slug = "" } = useParams();

  return (
    <AppShell>
      <Panel title={`Player · ${slug}`} className="mx-auto max-w-xl">
        <EmptyState icon="crystal" title="Portfolio coming soon" description="Public profiles are not available yet." />
      </Panel>
    </AppShell>
  );
}
