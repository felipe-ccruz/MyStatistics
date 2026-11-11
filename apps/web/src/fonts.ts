/*
 * Self-hosted fonts: latin subset only, and only the weights the dashboard uses
 * (at most two per family, see plans/pixel-art.md §2.5). Medium (500) falls back
 * to 400 and bold falls back to 600, so stick to font-normal / font-semibold.
 * Title fonts ship a single weight: keep titles at font-normal (no fake bold).
 */
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "@fontsource/pixelify-sans/latin-400.css";
import "@fontsource/silkscreen/latin-400.css";
