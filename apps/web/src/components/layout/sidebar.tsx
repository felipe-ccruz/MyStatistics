import { UserRound } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Foto de perfil — ocupa 30% da altura da sidebar (placeholder, sem foto ainda) */}
      <div className="relative h-[30%] shrink-0 overflow-hidden">
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-primary/15 via-sidebar to-sidebar">
          <UserRound className="size-16 text-muted-foreground/40" strokeWidth={1.25} />
        </div>
        {/* fade suave pro corpo da sidebar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sidebar to-transparent" />
      </div>

      {/* resto da sidebar — vazio por enquanto */}
      <div className="flex-1" />
    </aside>
  );
}
