import { useSyncExternalStore } from "react";

/** The two dashboard themes (D11). The id is the `data-dir` value on <html>. */
export const THEMES = [
  { id: "a", label: "A · Teal Grimoire", swatch: "#2dd4bf" },
  { id: "b", label: "B · Violet System", swatch: "#c084fc" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "a";

/** Also read by the inline script in index.html, which applies it before the first paint. */
export const THEME_STORAGE_KEY = "mystatistics.theme";

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

/** Saved preference; storage can be unavailable (private mode, blocked cookies), so never throw. */
export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function currentTheme(): ThemeId {
  const dir = document.documentElement.dataset.dir;
  return isThemeId(dir) ? dir : DEFAULT_THEME;
}

const listeners = new Set<() => void>();

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.dir = theme;
  for (const listener of listeners) listener();
}

/** Applies the theme and remembers it for the next visit. */
export function setTheme(theme: ThemeId) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not persisted, but still applied for this visit.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the theme: follow it.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) applyTheme(readStoredTheme());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTheme(): [ThemeId, (theme: ThemeId) => void] {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => DEFAULT_THEME);
  return [theme, setTheme];
}
