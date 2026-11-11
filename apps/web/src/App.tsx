import { Panel, PanelBadge } from "@/components/game/panel";
import { Sidebar } from "@/components/layout/sidebar";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { useHealth } from "@/queries/health";

function SystemLink() {
  const health = useHealth();

  if (health.isPending) return <LoadingState title="System link" rows={2} />;
  if (health.isError) {
    return (
      <Panel title="System link">
        <ErrorState error={health.error} onRetry={() => void health.refetch()} retrying={health.isFetching} />
      </Panel>
    );
  }
  return (
    <Panel title="System link" aside={<PanelBadge>/api/health</PanelBadge>}>
      <p className="font-mono text-xs text-mut">
        API <span className="text-txt">{health.data.status}</span> · database{" "}
        <span className={health.data.db === "ok" ? "text-pos" : "text-hp"}>{health.data.db}</span>
      </p>
    </Panel>
  );
}

export function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex max-w-md flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="font-title text-xl font-normal tracking-ls text-txt">MyStatistics</h1>
          <p className="font-mono text-[11px] text-mut uppercase">System v0.1</p>
        </div>
        <SystemLink />
      </main>
    </div>
  );
}

export default App;
