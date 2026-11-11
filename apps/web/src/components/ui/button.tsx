import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm transition-[color,border-color,background-color,filter] cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-acc/50 aria-invalid:border-hp",
  {
    variants: {
      variant: {
        default:
          "border-acc bg-acc text-ink font-title tracking-ls shadow-glow2 hover:brightness-110 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        destructive: "border-hp bg-hp text-ink hover:brightness-110",
        outline: "border-line bg-transparent text-txt hover:border-line2 hover:text-acc",
        secondary: "border-line bg-inset text-txt hover:border-line2",
        ghost: "border-transparent bg-transparent text-mut hover:bg-inset hover:text-acc",
        link: "border-transparent text-acc underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 text-sm has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-6",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
