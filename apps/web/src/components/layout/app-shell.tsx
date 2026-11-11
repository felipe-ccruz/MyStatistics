import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./app-header";

type AppShellProps = {
  children: ReactNode;
  showRules?: boolean;
  /** Header actions (logout, from T4.2). */
  actions?: ReactNode;
  className?: string;
};

/** Page frame shared by every route: header on top, page content below. */
export function AppShell({ children, showRules, actions, className }: AppShellProps) {
  return (
    <div className="min-h-dvh px-4 pt-5 pb-10 sm:px-6">
      <AppHeader showRules={showRules} actions={actions} />
      <main className={cn("min-w-0", className)}>{children}</main>
    </div>
  );
}
