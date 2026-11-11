import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-line bg-inset text-txt placeholder:text-dim selection:bg-acc selection:text-ink rounded-md border shadow-none transition-[color,border-color,box-shadow] outline-none focus-visible:border-acc focus-visible:ring-1 focus-visible:ring-acc/40 aria-invalid:border-hp aria-invalid:ring-hp/30 disabled:cursor-not-allowed disabled:opacity-50",
        "h-10 w-full min-w-0 px-3 py-1 text-sm file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:text-txt",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
