import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toast host, placed once at the app root. Both themes are dark, so the theme is
 * fixed (no next-themes). Prefer `notify` from components/game/system-toast for
 * the model's "[ SYSTEM ]" toast; the classNames below style any plain `toast()`.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      duration={2900}
      offset={24}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-md border border-line2 bg-card2 px-4 py-3 text-txt shadow-glow2",
          title: "font-title text-sm font-normal text-txt",
          description: "text-xs text-mut",
          error: "border-hp",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
