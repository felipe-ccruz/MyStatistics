import { Sidebar } from "@/components/layout/sidebar";

export function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 p-6">
        <h1 className="font-title text-xl font-normal tracking-ls text-txt">MyStatistics</h1>
        <p className="font-mono text-[11px] text-mut uppercase">System v0.1</p>
      </main>
    </div>
  );
}

export default App;
