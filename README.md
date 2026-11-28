# Gianlucca Claudino — portfolio

Single-screen portfolio with an ASCII intro and a moonlit sea. No scrolling or camera travel.

## Current experience

- On each page load, one of 37 tte.js effects is randomly selected to reveal the official ASCII logo. The animation lasts between 1 and 2.75 s, followed by a final 0.25 s pause: a cycle of at most 3 s, with no looping. The intro remains monochrome.
- The intro, drop, and sea share a charcoal (`#2d3038`) and ivory (`#ece7cd`) palette inspired by *Return of the Obra Dinn*. The opening effects retain translucent ivory shades; the scene is dithered to two colors. The camera faces a level horizon at 72% of the viewport. A centered moon, stippled cloud banks, a side-on ship and broken horizontal reflections share one axis.
- After the intro, an ASCII drop reaches the water in 0.95 s. Its impact wave reveals the sea over 2.8 s; the night sky fades in independently. The horizon remains fixed.
- The hero is centered below the moon at `36svh`. [ascii-reveal](https://github.com/quanhoangindex/ascii-reveal) 0.3.0 provides the dither reveal and shimmer. The roles cycle between `Creative Technologist`, `Frontend Specialist`, and `Product Engineer`, with 3.2 s reading pauses. Hover or keyboard focus on the title reveals the nickname.
- Two swells and six wind waves shape the surface. Shallow horizontal streaks form the moon's reflection; distant waves compress toward the horizon.
- Wind appears as long ASCII streaks, without spirals, layers, or branches. A new pass starts every 1.25 s and lasts 12 s, allowing up to ten simultaneous streaks. Base opacities between 0.20 and 0.38 vary smoothly with distance, with soft tips and slow undulation. Weight-500 strokes remain legible, without the double vertical compression that previously made them almost invisible. Length follows depth, up to approximately 560 px on desktop and 80% of the width on mobile. Pressure fields still affect the water without increasing wave height.
- Birds use compact three-line, five-column ASCII silhouettes, with a beak, body, and wings in three poses. They fly alone, in pairs, or in five-bird V formations, with a leader and two pairs behind. Each flock spawns entirely offscreen, enters through one side, and exits through the opposite side, without fading into the middle of the scene. A new group appears every 5.5 s, with flights lasting 12–15 s and up to three simultaneous groups. The ship scares flocks within a depth-dependent radius; all birds flee away from the hull, flapping faster. The cursor alone does not scare birds.
- The ship starts broadside at the center of the horizon. A pointer over the water steers it; the hull stays below the horizon and the masts stay upright as it turns.
- Low mist and the breezes remain on the water side of the horizon. The ship's silhouette is drawn over that mist; birds and motes are composited last.
- Birds, breezes, fog, insects, and dust share depth: scale, spacing, opacity, and apparent speed decrease with distance. Foam and the wake remain anchored to the hull; the ship continues to scare flocks.
- Reduced motion keeps a still composition of the sky, sea and centered ship, with no drop, wave, wind or role cycle. Animation pauses while the tab is hidden.

React 19 + TypeScript + Vite, GSAP for the loader fade, and [tte.js](https://github.com/flaviocopes/tte-js) for the opening effect (MIT, pinned to `9b120c2f65d48f996a027ef061712bb87ad467bb`). `MoonlitBackdrop` caches the procedural sky on resize. `AsciiPerspective` projects the water below the horizon; spatial phases and depth filters are cached. `RiverPalette` quantizes the composed CPU-backed Canvas 2D frame using cached threshold rows. The scene targets 60 fps at approximately 0.9 megapixels per frame, without WebGL, a CSS scene filter, or per-frame React updates.

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

`?intro=0` shows the sea and hero directly, skipping the loader, drop and impact wave.

The standalone GitHub cover files in `github-profile/` are separate from the site.

## Verification

Chromium at 1440×900 maintained 60 scene draws per second (p95 interval: 17.3 ms) while the ship followed the pointer. Wheel, Page Down and a touch swipe at 390×844 left the page at its original position. The canvas used exactly two colors; reduced motion kept the mobile scene static.

Batch rasterization reduced the median drawing cost by approximately 83% in an isolated 45-frame scenario at 1440×900. This measures drawing-call time, not FPS or GPU time. Masks preserved the antialiased coverage of the native composition, including overlaps and edge clipping (a maximum difference of one alpha level).

Direct Canvas dithering delivered 60 scene draws per second in 2.4-second Chromium samples at 1440×900 (DPR 1.5) and 2560×1440 (DPR 2), with 95th-percentile frame intervals of 17.4 ms and 17.7 ms respectively. The sampled raster used only the two intended colors.

## Water references

- [GPU Gems — Effective Water Simulation from Physical Models](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): wave summation, analytical derivatives, and filtering.
- [Ocean waves with WebGL — Matthias Volk](https://relint.de/waves.html): dispersion, normals, and reflection's contribution to the appearance of water. The local implementation does not use FFT or WebGL.
- [Obsessed Waves — Ken Goyarola](https://kgaw.io/projects/obsessed-waves/): visual reference for ASCII continuity and depth; its code, objects, and controls were not incorporated.

