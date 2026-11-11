import { mirrorRow, type Palette, type Sprite } from "../sprite";

/**
 * Player avatar from the dashboard model, 32×32. Only the left half of each
 * row is stored; the right half is its mirror image.
 */
const HALF = [
  "................",
  "................",
  "..........kkkkkk",
  "........kkhhhhhh",
  ".......khhhhhhhh",
  "......khhhHHhhhh",
  ".....khhhHhhhhhh",
  ".....khhHhhhhhhh",
  "....khhhhhhhhhhh",
  "....khhhhhhhhhhh",
  "....khhhhhhshhhh",
  "....khhhsssssshh",
  "....khhsssssssss",
  "....khhssskkssss",
  "....khhssseessss",
  "....khhsssewssss",
  "....khhsssssssss",
  "....khhSssssssss",
  "....khhhSsssssss",
  ".....khhSssssssm",
  ".....khhhSssssss",
  "......khhhSSssss",
  "......khhhhkkSSS",
  ".....khhhhhhkSSS",
  "....kcchhhhkcwwS",
  "...kcccchhhkccwa",
  "..kccccchhkcccwa",
  ".kcccCcccckcccwa",
  ".kccCccccccccwwa",
  "kccCcccccccccwwa",
  "kcCccccccccccwwa",
  "kcCcccccccccccwa",
];

/** Closed eyes (rows 13–15, columns 10–11 and 20–21), shown for an instant by the blink. */
const BLINK_HALF = ["..........ss....", "..........kk....", "..........ss...."];

/** Skin and outline are fixed; hair, coat and accents follow the theme. */
const PALETTE: Palette = {
  k: "#06080c",
  h: "var(--av-hair)",
  H: "var(--acc)",
  s: "#f0d2b8",
  S: "#cfa184",
  e: "var(--acc2)",
  w: "#eef2f6",
  c: "var(--av-coat)",
  C: "var(--av-coat2)",
  a: "var(--acc)",
  m: "#b5675a",
};

const ROWS = HALF.map(mirrorRow);
const HEAD_ROWS = 24;

export const avatar: Sprite = {
  width: 32,
  height: 32,
  palette: PALETTE,
  layers: [
    { rows: ROWS.slice(HEAD_ROWS), y: HEAD_ROWS },
    {
      rows: ROWS.slice(0, HEAD_ROWS),
      className: "px-av-head",
      children: [{ rows: BLINK_HALF.map(mirrorRow), y: 13, className: "px-av-blink" }],
    },
  ],
};
