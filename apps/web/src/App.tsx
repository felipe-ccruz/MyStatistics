import { Sidebar } from "@/components/layout/sidebar";
import { useHealth } from "@/queries/health";

function HealthLine() {
  const health = useHealth();

  if (health.isPending) return <p className="font-mono text-xs text-mut">Checking the API…</p>;
  if (health.isError) return <p className="font-mono text-xs text-hp">{health.error.message}</p>;
  return (
    <p className="font-mono text-xs text-mut">
      API {health.data.status} · database {health.data.db}
    </p>
  );
}

export function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 p-6">
        <h1 className="font-title text-xl font-normal tracking-ls text-txt">MyStatistics</h1>
        <p className="font-mono text-[11px] text-mut uppercase">System v0.1</p>
        <HealthLine />
      </main>
    </div>
  );
}

export default App;
