import { type CSSProperties, useId } from "react";
import { cn } from "@/lib/utils";
import { type RenderedLayer, renderSprite, type Sprite } from "./sprite";
import "./pixel.css";

type PixelSpriteProps = {
  sprite: Sprite;
  /** On-screen size (px number or any CSS length, e.g. "100%"). The viewBox comes from the grid. */
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  /** Accessible name. Without it the sprite is decorative (aria-hidden). */
  title?: string;
  /** SVG alignment when the box is not square (the avatar sits on the bottom edge). */
  align?: "center" | "bottom";
};

function Layer({ layer }: { layer: RenderedLayer }) {
  return (
    <g className={layer.className}>
      {layer.paths.map((p) => (
        <path key={p.key} d={p.d} fill={p.fill} opacity={p.opacity} />
      ))}
      {layer.children.map((child) => (
        <Layer key={child.key} layer={child} />
      ))}
    </g>
  );
}

export function PixelSprite({ sprite, size = 16, className, style, title, align = "center" }: PixelSpriteProps) {
  const titleId = useId();
  const svgProps = {
    viewBox: `0 0 ${sprite.width} ${sprite.height}`,
    width: size,
    height: size,
    preserveAspectRatio: align === "bottom" ? "xMidYMax meet" : "xMidYMid meet",
    shapeRendering: "crispEdges",
    className: cn("block shrink-0", className),
    style,
  };
  const content = renderSprite(sprite).map((layer) => <Layer key={layer.key} layer={layer} />);

  if (!title) {
    return (
      <svg {...svgProps} aria-hidden="true">
        {content}
      </svg>
    );
  }

  return (
    <svg {...svgProps} role="img" aria-labelledby={titleId}>
      <title id={titleId}>{title}</title>
      {content}
    </svg>
  );
}
