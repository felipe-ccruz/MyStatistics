import { Panel, PanelBadge } from "@/components/game/panel";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { useHealth } from "@/queries/health";

const TITLE = "System link";

/** API and database status from GET /api/health, with the three states. */
export function SystemLinkPanel() {
  const health = useHealth();

  if (health.isPending) return <LoadingState title={TITLE} rows={2} label="Checking the API…" />;

  if (health.isError) {
    return (
      <Panel title={TITLE}>
        <ErrorState
          title="API unreachable"
          error={health.error}
          onRetry={() => void health.refetch()}
          retrying={health.isFetching}
        />
      </Panel>
    );
  }

  const dbUp = health.data.db === "ok";
  return (
    <Panel title={TITLE} aside={<PanelBadge>/api/health</PanelBadge>}>
      <dl className="m-0 grid grid-cols-2 gap-2.5">
        <div className="rounded-md border border-line bg-inset p-3">
          <dt className="text-[11px] tracking-[0.06em] text-mut uppercase">API</dt>
          <dd className="m-0 mt-1.5 font-title text-lg text-txt text-shadow-tglow">{health.data.status}</dd>
        </div>
        <div className="rounded-md border border-line bg-inset p-3">
          <dt className="text-[11px] tracking-[0.06em] text-mut uppercase">Database</dt>
          <dd className={dbUp ? "m-0 mt-1.5 font-title text-lg text-pos" : "m-0 mt-1.5 font-title text-lg text-hp"}>
            {dbUp ? "online" : "down"}
          </dd>
        </div>
      </dl>
    </Panel>
  );
}
