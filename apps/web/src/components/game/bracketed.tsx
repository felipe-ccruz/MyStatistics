import type { ReactNode } from "react";

/**
 * The model's "[TITLE]" look. The brackets are decoration, hidden from screen readers
 * so they read "Log activity", not "left bracket Log activity right bracket".
 */
export function Bracketed({ children, spaced = false }: { children: ReactNode; spaced?: boolean }) {
  return (
    <>
      <span aria-hidden="true">{spaced ? "[ " : "["}</span>
      {children}
      <span aria-hidden="true">{spaced ? " ]" : "]"}</span>
    </>
  );
}
