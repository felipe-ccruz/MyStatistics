import { THEMES, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Segmented theme switch from the model's header. */
export function ThemePicker() {
  const [theme, setTheme] = useTheme();

  return (
    <fieldset className="m-0 flex min-w-0 gap-[3px] rounded-md border border-line bg-inset p-[3px]">
      <legend className="sr-only">Theme</legend>
      {THEMES.map((option) => {
        const active = option.id === theme;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(option.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3 py-[7px] font-title text-[11px] tracking-ls whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-acc/50",
              active ? "bg-acc text-ink" : "bg-transparent text-mut hover:text-txt",
            )}
          >
            <span aria-hidden="true" className="size-2 shrink-0" style={{ background: option.swatch }} />
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
