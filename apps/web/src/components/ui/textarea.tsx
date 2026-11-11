import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-line bg-inset text-txt placeholder:text-dim selection:bg-acc selection:text-ink rounded-md border shadow-none transition-[color,border-color,box-shadow] outline-none focus-visible:border-acc focus-visible:ring-1 focus-visible:ring-acc/40 aria-invalid:border-hp aria-invalid:ring-hp/30 disabled:cursor-not-allowed disabled:opacity-50",
        "flex field-sizing-content min-h-16 w-full px-3 py-2 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
