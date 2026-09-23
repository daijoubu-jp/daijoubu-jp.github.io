# Prefecture Map: Zoom Controls + Region Colorization

Date: 2026-09-23. Source: `revisions.md` TODO (`knowledge/` map zoom block).

## Scope (from revisions.md)

- Zoom UI pinned to the **top-right corner** of the map card.
- Zoom by region (8 地方, matching the site's existing region scheme — the TODO's
  "Hokkaido and Tohoku" parenthetical is read as an example listing, not a merged region).
- Zoom in / out, reset view, vertical pan adjustment (Japan is tall; vertical is the useful axis).
- Colorize each region with theme-based colors.

## Colorization reconciliation

2026-09-14 made land uniformly white on blue water (reference screenshot requirement).
The open TODO wants per-region color. Both are honored by adding a third tier:

| Tier | Variable | Use |
| --- | --- | --- |
| base (new) | `--region-base` = color-mix(accent N%, white), N = 52→10 across regions 0–7 | default map fill + legend/list swatches |
| tint (exists) | `--region-tint` (24–85% mixes) | hover / focus / region-selected fill |
| fill (exists) | `--region-fill` | detail-page badges (unchanged) |

Pastel land on `#d9e8f5`/`#17324e` water keeps the cartographic contrast in all 6 themes
and both modes; browsers without `color-mix()` fall back to the current white land.
Monotonic intensity north→south doubles as a latitude cue, matching the legend gradient.

## Zoom architecture

viewBox manipulation, no CSS transforms (keeps stroke widths, hit areas, and tooltip
client-coordinate math correct).

Pure exports added to `assets/js/prefectures-map.js` (TDD, mirrored in `tests/prefectures.test.mjs`):

- `parseViewBox(str)` / `formatViewBox(v)` — round-trip, 2-decimal serialization.
- `MIN_SCALE = 0.08` — max zoom-in ≈ 12.5×; scale 1 = whole country.
- `zoomViewBox(view, base, factor)` — zoom about view center; clamps scale to [MIN_SCALE, 1];
  aspect ratio always follows `base` so nothing distorts; result clamped inside base rect.
- `panViewBoxY(view, base, dyRatio)` — shift by a fraction of view height, clamped inside base.
- `fitRegionViewBox(bounds, base)` — scale to contain the region bbox + 8% padding, center on it,
  clamp scale/position inside base.
- `buildMapControlsHtml()` — markup for the control cluster (pure, testable).

DOM wiring in `initPrefecturesMap()` after the SVG renders:

- Controls injected as `.pref-map-controls` (absolute, top-right of `#pref-map-wrap`, above tooltip z 30? no — below: z-index 20, tooltip 30).
- Region `<select>`: option value = region index; bounds computed at click time from the union
  of `getBBox()` of `.pref-region-<i>` paths (geometry lives in data, no hardcoded rects).
- Buttons: zoom in, zoom out, reset, pan up, pan down — Font Awesome icons + Thai aria-labels.
- View changes tween the `viewBox` attribute over ~320 ms (ease-in-out cubic, rAF);
  `prefers-reduced-motion: reduce` jumps instantly. An in-flight tween is cancelled by any new command.
- Reset restores the base viewBox and the select's "ทั้งหมด" option.
- Legend filter and region zoom stay orthogonal: chips dim/highlight, the select moves the viewport.

## Files

- `assets/js/prefectures-map.js` — pure zoom math + controls markup + init wiring.
- `assets/css/prefectures.css` — `--region-base` tier, default path fill, swatch switch, `.pref-map-controls` styles, mobile sizing.
- `tests/prefectures.test.mjs` — zoom-math contracts, control markup, region-class coverage invariants.
- `sw.js` — `CACHE_NAME` v7 → v8 (app shell code changed).
- `revisions.md` — TODO → HAVEDONE with timestamp.

No data pipeline changes (`data/prefectures-map.json` untouched, so `compile_content.py --check` stays clean
and `DATA_VERSION` needs no bump).

## Verification

1. `npm test` (expect 120 + new), `npx markdownlint-cli2 "**/*.md"`, `python3 scripts/compile_content.py --check`.
2. Browser QA on `python3 -m http.server`: default tinted map, region select zoom (北海道, 関東, 九州・沖縄),
   in/out/reset, vertical pan clamping at both ends, hover/tooltip still correct while zoomed,
   click-through navigation still works, dark mode + a second theme (e.g. summer/anime), reduced-motion jump.
