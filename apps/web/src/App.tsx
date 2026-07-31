import { Sidebar } from "@/components/layout/sidebar";

export function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      {/* área principal — vazia por enquanto */}
      <main className="flex-1" />
    </div>
  );
}

export default App;
