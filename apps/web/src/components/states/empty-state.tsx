import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PixelSprite } from "@/pixel/PixelSprite";
import { type IconName, icons } from "@/pixel/sprites/icons";

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  /** Optional call to action, e.g. a PixelButton that opens the "Log activity" dialog. */
  action?: ReactNode;
  className?: string;
};

/** "Nothing here yet" block, placed inside a Panel. */
export function EmptyState({ icon = "crystal", title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-md border border-line2 border-dashed bg-inset px-4 py-6 text-center",
        className,
      )}
    >
      <PixelSprite sprite={icons[icon]} size={26} className="text-dim" />
      <p className="font-title text-sm text-txt">{title}</p>
      {description ? <p className="max-w-xs text-xs text-mut">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
