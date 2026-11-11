import {
  CLASS_NAMES,
  DAILY_GOAL_MINUTES,
  DAILY_GOAL_REWARD,
  FULL_CLEAR_BONUS,
  RANKS,
  type Rank,
  xpToNextLevel,
} from "@mystatistics/shared";
import { Fragment, type ReactNode } from "react";
import { PixelButton } from "@/components/game/pixel-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORIES, CATEGORY_META, formatXpRate } from "@/lib/categories";

/*
 * Not in @mystatistics/shared yet (requested as a contract change): the first level of
 * each rank and the FOCUS divisor. Typed against the shared `Rank`, so a new rank breaks here.
 */
const RANK_MIN_LEVEL: Record<Rank, number> = { E: 1, D: 5, C: 10, B: 15, A: 20, S: 30 };
const FOCUS_SESSION_MINUTES = 75;

const [INT_CLASS, STR_CLASS, TIE_CLASS] = CLASS_NAMES;
const STUDY_GOAL = DAILY_GOAL_MINUTES.study;
const EXERCISE_GOAL = DAILY_GOAL_MINUTES.exercise;

/** `xpToNextLevel` is linear: `step × n + base`. */
const LEVEL_BASE = xpToNextLevel(0);
const LEVEL_STEP = xpToNextLevel(1) - LEVEL_BASE;
const EXAMPLE_LEVEL = 7;

/** "E (1–4) · D (5–9) · … · S (30+)". */
function rankRanges(): string {
  return RANKS.map((rank, i) => {
    const from = RANK_MIN_LEVEL[rank];
    const next = RANKS[i + 1];
    return next === undefined ? `${rank} (${from}+)` : `${rank} (${from}–${RANK_MIN_LEVEL[next] - 1})`;
  }).join(" · ");
}

type Piece = { key: string; node: ReactNode };

/** Joins inline pieces with " · ". */
function dotted(pieces: Piece[]): ReactNode {
  return pieces.map((piece, i) => (
    <Fragment key={piece.key}>
      {i > 0 ? " · " : null}
      {piece.node}
    </Fragment>
  ));
}

/**
 * Progress rules locked in decision D5 (plans/mvp-tasks.md), built from the shared
 * constants so the text cannot drift from what the server computes.
 */
const RULES: { name: string; text: ReactNode }[] = [
  {
    name: "XP",
    text: (
      <>
        Per day and category, rounded down:{" "}
        {dotted(
          CATEGORIES.map((c) => ({
            key: c.category,
            node: (
              <>
                {c.label} <b>{formatXpRate(c.category)}</b> → {c.attribute}
              </>
            ),
          })),
        )}
      </>
    ),
  },
  {
    name: "Daily quest",
    text: dotted([
      ...CATEGORIES.map((c) => ({
        key: c.category,
        node: (
          <>
            {c.label} {DAILY_GOAL_MINUTES[c.category]} min <b>+{DAILY_GOAL_REWARD[c.category]}</b>
          </>
        ),
      })),
      {
        key: "full-clear",
        node: (
          <>
            all on the same day <b>+{FULL_CLEAR_BONUS}</b>
          </>
        ),
      },
    ]),
  },
  {
    name: "Level",
    text: (
      <>
        XP to go up from level n = <b>{`${LEVEL_STEP} × n + ${LEVEL_BASE}`}</b>{" "}
        {`(L${EXAMPLE_LEVEL} → L${EXAMPLE_LEVEL + 1} = ${xpToNextLevel(EXAMPLE_LEVEL)} XP)`}
      </>
    ),
  },
  { name: "Rank", text: rankRanges() },
  {
    name: "Attributes",
    text: [
      "30-day average, 0–100 scale.",
      `INT = study per day ÷ ${STUDY_GOAL} min`,
      `· STR = exercise per day ÷ ${EXERCISE_GOAL} min`,
      `· FOCUS = average study session ÷ ${FOCUS_SESSION_MINUTES} min`,
      "· DISCIPLINE = % of days with both categories",
    ].join(" "),
  },
  {
    name: "Status",
    text: [
      `MP = study today ÷ ${STUDY_GOAL} min`,
      `STA = 7-day exercise average ÷ ${EXERCISE_GOAL} min`,
      "MOOD = % of today's quest goals done",
    ].join(" · "),
  },
  {
    name: "Class",
    text: `Dominant attribute between ${CATEGORY_META.study.attribute} and ${CATEGORY_META.exercise.attribute}: ${INT_CLASS} · ${STR_CLASS} (tie: ${TIE_CLASS})`,
  },
  {
    name: "Streak",
    text: "Consecutive days with at least one activity (today counts once it has one). Best = longest streak ever.",
  },
];

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
