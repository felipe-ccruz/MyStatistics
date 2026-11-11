import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/** Square, pixel-styled switch: off = dim track, on = accent track with glow. The thumb jumps (steps). */
function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-md border p-[2px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-acc/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 data-[state=checked]:border-acc data-[state=checked]:bg-acc data-[state=checked]:shadow-glow2 data-[state=unchecked]:border-line data-[state=unchecked]:bg-inset",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-[1px] transition-transform duration-150 ease-[steps(2)] group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 data-[state=checked]:translate-x-[calc(100%+2px)] data-[state=checked]:bg-ink data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-mut"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
