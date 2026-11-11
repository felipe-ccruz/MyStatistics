import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Tabs({ className, orientation = "horizontal", ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("group/tabs flex gap-3 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  );
}

/** Segmented control from the model (theme picker, 7D/30D): inset track, active tab filled with the accent. */
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center gap-[3px] group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "rounded-md border border-line bg-inset p-[3px]",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border-0 px-2.5 py-1 font-title text-xs font-normal tracking-ls whitespace-nowrap text-mut transition-colors outline-none hover:text-txt focus-visible:ring-2 focus-visible:ring-acc/50 disabled:pointer-events-none disabled:opacity-50 group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "group-data-[variant=default]/tabs-list:data-[state=active]:bg-acc group-data-[variant=default]/tabs-list:data-[state=active]:text-ink",
        "group-data-[variant=line]/tabs-list:data-[state=active]:text-acc group-data-[variant=line]/tabs-list:data-[state=active]:text-shadow-tglow",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
