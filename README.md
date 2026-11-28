# Gianlucca Claudino — portfolio

Single-screen portfolio with an ASCII intro and a windblown meadow at sunrise. No scrolling or camera travel.

## Current experience

- On each page load, one of 37 tte.js effects is randomly selected to reveal the official ASCII logo. The animation lasts between 1 and 2.75 s, followed by a final 0.25 s pause: a cycle of at most 3 s, with no looping. The intro remains monochrome.
- The intro and meadow share a charcoal (`#2d3038`) and ivory (`#ece7cd`) palette inspired by *Return of the Obra Dinn*. The opening effects retain translucent ivory shades; the scene stays strictly two-color.
- The `lvsk` intro clears to a fully dark frame. The sun rises through a straight horizon at 72% of the screen over 3.8 seconds, lighting the clouds and short grass from the horizon toward the foreground. Traveling gusts bend the clumps at different depths.
- The hero appears below the sun with an [ascii-reveal](https://github.com/quanhoangindex/ascii-reveal) dither reveal. Roles cycle between `Creative Technologist`, `Frontend Specialist`, and `Product Engineer`, with 3.2 s reading pauses. Hover or keyboard focus on the title reveals the nickname.
- Reduced motion shows the fully lit meadow and sun without motion. Animation pauses while the tab is hidden.

React 19 + TypeScript + Vite, GSAP for the loader fade, and [tte.js](https://github.com/flaviocopes/tte-js) for the opening effect (MIT, pinned to `9b120c2f65d48f996a027ef061712bb87ad467bb`). `DawnLandscape` caches the clouds, halo and soil light. `WindMeadow` builds the grass geometry and spatial wind phases. `CanvasPalette` quantizes the CPU-backed Canvas 2D raster; after sunrise, only the moving part of the frame is updated. The scene targets 60 fps at approximately 0.9 megapixel, without WebGL, a CSS scene filter, or per-frame React updates.

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

Chromium at 1440×900 (DPR 1.5) rendered the lit meadow at 60 frames per second. Pixel samples confirmed a fully dark first frame after the loader, a rising disc before any illuminated grass, then illumination reaching the distant grass before the foreground. At 390×844, reduced motion preserved the two-color still frame without overflow.

