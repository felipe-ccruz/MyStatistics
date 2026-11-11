import { PixelButton } from "@/components/game/pixel-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Progress rules locked in decision D5 (plans/mvp-tasks.md). The server computes them. */
const RULES = [
  {
    name: "XP",
    text: (
      <>
        Per day and category, rounded down: Study <b>1 XP/min</b> → INT · Exercise <b>1.2 XP/min</b> → STR
      </>
    ),
  },
  {
    name: "Daily quest",
    text: (
      <>
        Study 90 min <b>+50</b> · Exercise 45 min <b>+40</b> · both on the same day <b>+100</b>
      </>
    ),
  },
  {
    name: "Level",
    text: (
      <>
        XP to go up from level n = <b>100 × n + 200</b> (L7 → L8 = 900 XP)
      </>
    ),
  },
  { name: "Rank", text: <>E (1–4) · D (5–9) · C (10–14) · B (15–19) · A (20–29) · S (30+)</> },
  {
    name: "Attributes",
    text: (
      <>
        30-day average, 0–100 scale. INT = study per day ÷ 90 min · STR = exercise per day ÷ 45 min · FOCUS = average
        study session ÷ 75 min · DISCIPLINE = % of days with both categories
      </>
    ),
  },
  {
    name: "Status",
    text: <>MP = study today ÷ 90 min · STA = 7-day exercise average ÷ 45 min · MOOD = % of today's quest goals done</>,
  },
  {
    name: "Class",
    text: <>Dominant attribute between INT and STR: Arcane Student · Iron Warrior (tie: Adventurer)</>,
  },
  {
    name: "Streak",
    text: <>Consecutive days with at least one activity (today counts once it has one). Best = longest streak ever.</>,
  },
] as const;

export function SystemRulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <PixelButton variant="outline" icon="excl">
          System rules
        </PixelButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>System rules</DialogTitle>
          <DialogDescription>
            Everything below is derived from your activities (category, minutes and date).
          </DialogDescription>
        </DialogHeader>
        <dl className="m-0 grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[13px]">
          {RULES.map((rule) => (
            <div key={rule.name} className="contents">
              <dt className="font-title text-acc">{rule.name}</dt>
              <dd className="m-0 [&_b]:font-semibold">{rule.text}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
