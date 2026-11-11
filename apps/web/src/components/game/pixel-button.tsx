import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { PixelSprite } from "@/pixel/PixelSprite";
import { type IconName, icons } from "@/pixel/sprites/icons";

const pixelButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-md border whitespace-nowrap transition-[color,border-color,background-color,filter] outline-none focus-visible:ring-2 focus-visible:ring-acc/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Main call to action ("Log activity", "Log"): accent fill, pixel font, glow. */
        primary: "border-acc bg-acc font-title tracking-ls text-ink shadow-glow2 hover:brightness-110",
        /** Header buttons ("System rules"): outlined, accent on hover. */
        outline: "border-line bg-transparent text-txt hover:border-line2 hover:text-acc",
        /** Icon-only utility (delete): dim until hovered. */
        ghost: "border-transparent bg-transparent text-dim hover:border-line hover:text-hp",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-2 text-[13px]",
        lg: "px-4 py-3 text-sm",
        icon: "size-6 p-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

type PixelButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof pixelButtonVariants> & {
    /** Pixel icon drawn before the label (accent-colored on outline buttons). */
    icon?: IconName;
  };

/**
 * Game-styled button from the model. For generic buttons use components/ui/button;
 * to style a link like this button, use `pixelButtonVariants` on the link.
 */
export function PixelButton({
  className,
  variant,
  size,
  block,
  icon,
  type = "button",
  children,
  ...props
}: PixelButtonProps) {
  const iconSize = size === "lg" ? 12 : 10;

  return (
    <button
      data-slot="pixel-button"
      type={type}
      className={cn(pixelButtonVariants({ variant, size, block }), className)}
      {...props}
    >
      {icon ? (
        <PixelSprite sprite={icons[icon]} size={iconSize} className={variant === "outline" ? "text-acc" : undefined} />
      ) : null}
      {children}
    </button>
  );
}

export { pixelButtonVariants };
