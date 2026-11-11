/**
 * Pixel art as data (plans/pixel-art.md): a sprite is a grid of characters plus
 * an optional palette, drawn as SVG paths. No image files.
 *
 * - `.` is transparent.
 * - Without a palette (monochrome icons) `#` is `currentColor` and `+` is
 *   `currentColor` at 40% opacity, so the color comes from the parent's CSS.
 * - With a palette every other character is a key of it (a hex color or a
 *   `var(--token)`, so colored sprites follow the theme).
 */

/** Character → fill color. */
export type Palette = Readonly<Record<string, string>>;

/** A group of rows drawn as one `<g>`, so it can be animated on its own. */
export type SpriteLayer = {
  readonly rows: readonly string[];
  /** Row offset inside the sprite grid (default 0). */
  readonly y?: number;
  readonly className?: string;
  /** Nested layers move with their parent (e.g. the blink on the avatar's head). */
  readonly children?: readonly SpriteLayer[];
};

export type Sprite = {
  readonly width: number;
  readonly height: number;
  readonly palette?: Palette;
  readonly layers: readonly SpriteLayer[];
};

/** One `<path>` per distinct fill inside a layer. */
export type PixelPath = {
  readonly key: string;
  readonly d: string;
  readonly fill: string;
  readonly opacity?: number;
};

export type RenderedLayer = {
  readonly key: string;
  readonly className?: string;
  readonly paths: readonly PixelPath[];
  readonly children: readonly RenderedLayer[];
};

const MONO: Readonly<Record<string, { fill: string; opacity?: number }>> = {
  "#": { fill: "currentColor" },
  "+": { fill: "currentColor", opacity: 0.4 },
};

/**
 * Each run grows 0.02 on every side: it hides the hairline between pixels that
 * shows up at fractional zoom levels (110%, 125%...). Same trick as the model.
 */
const BLEED = 0.02;

const num = (n: number) => String(Math.round(n * 100) / 100);

function resolveFill(ch: string, palette: Palette | undefined): { fill: string; opacity?: number } | null {
  if (ch === "." || ch === " ") return null;
  if (!palette) return MONO[ch] ?? null;
  const fill = palette[ch];
  return fill === undefined ? null : { fill };
}

/** Run-length encodes every row and merges all runs of the same fill into one path. */
export function layerPaths(rows: readonly string[], palette: Palette | undefined, y0 = 0): PixelPath[] {
  const byFill = new Map<string, { fill: string; opacity?: number; d: string[] }>();

  rows.forEach((row, rowIndex) => {
    const y = y0 + rowIndex;
    let x = 0;
    while (x < row.length) {
      const ch = row.charAt(x);
      let w = 1;
      while (x + w < row.length && row.charAt(x + w) === ch) w++;

      const style = resolveFill(ch, palette);
      if (style) {
        const key = `${style.fill}|${style.opacity ?? 1}`;
        let group = byFill.get(key);
        if (!group) {
          group = { ...style, d: [] };
          byFill.set(key, group);
        }
        const width = w + BLEED * 2;
        group.d.push(`M${num(x - BLEED)} ${num(y - BLEED)}h${num(width)}v${num(1 + BLEED * 2)}h-${num(width)}z`);
      }
      x += w;
    }
  });

  return [...byFill.entries()].map(([key, group]) => ({
    key,
    d: group.d.join(""),
    fill: group.fill,
    opacity: group.opacity,
  }));
}

function renderLayer(layer: SpriteLayer, palette: Palette | undefined, key: string): RenderedLayer {
  return {
    key,
    className: layer.className,
    paths: layerPaths(layer.rows, palette, layer.y ?? 0),
    children: (layer.children ?? []).map((child, i) => renderLayer(child, palette, `${key}.${i}`)),
  };
}

const cache = new WeakMap<Sprite, readonly RenderedLayer[]>();

/** Paths of a sprite, computed once per sprite object (sprites are module constants). */
export function renderSprite(sprite: Sprite): readonly RenderedLayer[] {
  const cached = cache.get(sprite);
  if (cached) return cached;
  const rendered = sprite.layers.map((layer, i) => renderLayer(layer, sprite.palette, String(i)));
  cache.set(sprite, rendered);
  return rendered;
}

/** A single-layer monochrome sprite (the 10×10 icons). */
export function monoSprite(rows: readonly string[]): Sprite {
  return {
    width: Math.max(...rows.map((r) => r.length)),
    height: rows.length,
    layers: [{ rows }],
  };
}

/** Left half + its mirror image (the avatar stores only half of each row). */
export function mirrorRow(half: string): string {
  return half + [...half].reverse().join("");
}
