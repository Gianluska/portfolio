# Gianlucca Claudino — portfolio

An ASCII portfolio that starts in a windblown meadow at sunrise and ascends through the atmosphere into space.

## Current experience

- On each page load, one of 37 tte.js effects is randomly selected to reveal the official ASCII logo. The animation lasts between 1 and 2.75 s, followed by a final 0.25 s pause: a cycle of at most 3 s, with no looping. The intro remains monochrome.
- The intro and meadow share a charcoal (`#2d3038`) and ivory (`#ece7cd`) palette inspired by *Return of the Obra Dinn*. The opening effects retain translucent ivory shades; the scene stays strictly two-color.
- The `lvsk` intro clears to a fully dark frame. The sun rises through a flat horizon at 39% of the screen over 3.8 seconds, slowing gently as it settles. Its light spreads from the horizon across the windblown meadow, then fades into the dark foreground around the hero. Thin clouds cross the disc, and small flocks pass through the sky.
- Horizontal mouse movement shifts the sun, clouds, three wooded ridges, and meadow by different amounts. Distant groves recede into haze; the nearest araucarias and broadleaf trees stay the clearest. Camera travel is slight, the hero stays fixed, and the camera eases back to center when the pointer leaves.
- The hero appears below the sun with an [ascii-reveal](https://github.com/quanhoangindex/ascii-reveal) dither reveal. Roles cycle between `Creative Technologist`, `Frontend Specialist`, and `Product Engineer`, with 3.2 s reading pauses. Hover or keyboard focus on the title reveals the nickname.
- Scroll down past the takeoff threshold or use **Ascend**. The hero breaks into descending strips while a ring of light ripples out from the sun. The 3.5 s ascent begins after the 1.8 s cue and runs without further input. Scroll back across the return threshold or use **Back to the meadow** for the 2.4 s descent.
- In orbit, individual stars twinkle at different rates while bands of light drift around the atmospheric rim. Horizontal mouse movement gently turns Earth on its axis: the curved horizon stays fixed while the surface and atmospheric bands slide beneath it. The sun, stars, and text stay anchored.
- Five company experiences (placeholder data in `src/data/work.ts`) sit along the curve of the Earth. Scroll, arrow keys, a horizontal drag, a vertical swipe, or a click on a neighbour turns the planet to the next item. The current title sets behind the horizon, the sun gives a small pulse, and the next title rises in its place while its period, role, summary, stack, and link are charted as a constellation in the sky. Scrolling up from the first item returns to the meadow.
- Reduced motion switches directly between the two still views. Animation pauses while the tab is hidden.

React 19 + TypeScript + Vite, GSAP for the loader fade, and [tte.js](https://github.com/flaviocopes/tte-js) for the opening effect (MIT, pinned to `9b120c2f65d48f996a027ef061712bb87ad467bb`). `DawnLandscape` caches the clouds, halo and soil light. `WindMeadow` builds the grass geometry and spatial wind phases. `CanvasPalette` quantizes the CPU-backed Canvas 2D raster. Daylight updates only the moving part of the frame, the flight targets 60 fps, and the settled orbit targets 30 fps at the same ~0.9 megapixel budget. No WebGL, CSS scene filter, or per-frame React updates.

Tailwind CSS 4 is compiled by the Vite plugin. Layout and state styles live in utilities alongside the React markup and DOM controllers. `src/tailwind.css` defines the local fonts and shared palette tokens. The stylesheet loads from `index.html` so the charcoal backdrop is available before React mounts. Preflight is disabled to preserve native element defaults; the `ascii-reveal` package still supplies its own skeleton styles.

Hero: local [Redaction 35](https://fonts.google.com/specimen/Redaction+35), Bold 700 for the name and Regular 400 for the roles. The artwork uses local Geist Mono. Both fonts use SIL OFL 1.1. The role box follows the actual width of the longest phrase.

## Running locally

Node.js 22.12+ and pnpm 12.21.0 (pinned in `package.json`).

```sh
pnpm install
pnpm dev
```

Use `pnpm install --frozen-lockfile` in CI and deployments.

## Production

```sh
pnpm build
pnpm preview
```

`pnpm typecheck` runs TypeScript only. `pnpm glyphs` regenerates the official intro logo and its per-letter variants.

`?intro=0` skips the loader and sunrise, showing the lit meadow and hero directly.

The standalone GitHub cover files in `github-profile/` are separate from the site.

## Verification

Check the desktop view from the loader through daylight. Move the pointer across the viewport: near grass travels farther than the valley, clouds, and sun while the text stays fixed and the edges remain filled. Scroll a little without taking off, then cross the threshold and release: the camera should complete the flight with the sun fixed. In orbit, step through every item with the wheel, arrows, drag, and swipe; check that one trackpad gesture moves one item and that scrolling up from the first item lands. Scroll back to land. Check the same path with touch and keyboard, and verify that reduced motion switches views without a flight.

