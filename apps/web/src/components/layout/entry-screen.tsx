import type { ReactNode } from "react";
import { Panel } from "@/components/game/panel";
import { PixelSprite } from "@/pixel/PixelSprite";
import { avatar } from "@/pixel/sprites/avatar";
import { AppShell } from "./app-shell";

type EntryScreenProps = {
  title: string;
  children: ReactNode;
};

/** "System entry" frame shared by /login and /signup: framed window with the avatar. */
export function EntryScreen({ title, children }: EntryScreenProps) {
  return (
    <AppShell className="flex justify-center pt-6">
      <Panel tone="quest" className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-24 border border-line2 bg-inset shadow-glow2">
            <PixelSprite sprite={avatar} size="100%" align="bottom" />
          </div>
          <h1 className="font-title text-base font-normal tracking-[0.1em] text-txt uppercase text-shadow-tglow">
            [{title}]
          </h1>
          {children}
        </div>
      </Panel>
    </AppShell>
  );
}
