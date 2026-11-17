# Gianlucca Claudino — portfolio

Portfolio with an ASCII intro, header, typographic hero, and a full-screen sea that becomes a waterfall as you scroll toward Projects. No card deck or 3D scene.

## Current experience

- On each page load, one of 37 tte.js effects is randomly selected to reveal the official ASCII logo. The animation lasts between 1 and 2.75 s, followed by a final 0.25 s pause: a cycle of at most 3 s, with no looping. The intro remains monochrome.
- The intro fades out and the header enters with the logo on the left and Projects / Contact on the right.
- Header hover and focus interactions are preserved: a font wave on the logo, scrambling, a spectral underline, and magnetic attraction on the links.
- After the intro, an ASCII drop falls into the center in 0.95 s. Its impact creates a wave in the surface itself, circular in the water plane and projected obliquely onto the screen. The crest and trough alter normals, reflections, and character positions; the wave reveals the sea across the viewport in 2.8 s, without overlaid rings.
- At 0.75 s into the river entrance—3 s before the sea is fully revealed—the hero displays `Gianlucca Claudino` and the roles below. The block is vertically centered on the left, with start-aligned text. The original `AsciiSkeleton` from [ascii-reveal](https://github.com/quanhoangindex/ascii-reveal), pinned to 0.3.0, uses `dither` blocks and shimmer in a left-to-right wave: the placeholder enters over 450 ms and reveals the new text in the same direction over the next 450 ms. The name receives the effect once; the roles cycle through `Creative Technologist` → `Frontend Specialist` → `Product Engineer`, with 3.2 s reading pauses. The role is non-interactive text: clicking does not pause or restart the cycle. Reduced motion keeps the text static.
- Water fills the screen in an angled perspective, without a channel, banks, or a drawn horizon. Broad, gentle crests in `~`, slopes in `-`, troughs in `.`, and rare highlights in `*` keep the sea calm. Waves become compressed and softer in the distance and broader in the foreground; distant frequencies are filtered to prevent flicker.
- Wind appears as long ASCII streaks, without spirals, layers, or branches. A new pass starts every 1.25 s and lasts 12 s, allowing up to ten simultaneous streaks. Base opacities between 0.20 and 0.38 vary smoothly with distance, with soft tips and slow undulation. Weight-500 strokes remain legible, without the double vertical compression that previously made them almost invisible. Length follows depth, up to approximately 560 px on desktop and 80% of the width on mobile. Pressure fields still affect the water without increasing wave height.
- Birds use compact three-line, five-column ASCII silhouettes, with a beak, body, and wings in three poses. They fly alone, in pairs, or in five-bird V formations, with a leader and two pairs behind. Each flock spawns entirely offscreen, enters through one side, and exits through the opposite side, without fading into the middle of the scene. A new group appears every 5.5 s, with flights lasting 12–15 s and up to three simultaneous groups. The ship scares flocks within a depth-dependent radius; all birds flee away from the hull, flapping faster. The cursor alone does not scare birds.
- The old sailing ship follows the pointer in an oblique view: the hull and deck rotate on the water plane, while the three masts and sails remain upright. Its size follows distance. It begins entering as soon as the shock wave reaches the center of the bottom edge, with a 0.8 s fade. The flag keeps fluttering with a smoothed direction, and the three sails billow out of phase. Everything uses the same Canvas and clock, without additional loops.
- Fog concentrates in the distance: an atmospheric veil reduces the contrast of distant water, and broad banks drift slowly across the sea plane, with ASCII texture and soft dispersion. The same veil passes over the breezes and ship, integrating the boat into the fog banks; the foreground remains clearer. Insects, dust, birds, and the hero sit in front. Two small atlases are reused, without blur or per-pixel noise during animation.
- Birds, breezes, fog, insects, and dust share depth: scale, spacing, opacity, and apparent speed decrease with distance. Foam and the wake remain anchored to the hull; the ship continues to scare flocks.
- Reduced motion: a static intro logo and water, without the drop, wave, breezes, birds, insects, dust, or fog. Scrolling switches between static sea and waterfall views without camera travel. Animation pauses while the tab is hidden.

React 19 + TypeScript + Vite; GSAP for the header entrance, local Geist Mono, and [tte.js](https://github.com/flaviocopes/tte-js) for the intro's Canvas effect. Water uses a local Canvas 2D engine, with two swells and six directional wind waves, analytical normals, and soft reflections. Inverse projection samples the angled plane; spatial phases and depth filters are precomputed. `AsciiPerspective` shares distance scaling between water and actors. Rendering is capped at 30 fps, without per-frame React updates, Three.js, or React Three Fiber. The MIT-licensed tte.js dependency is pinned to revision `9b120c2f65d48f996a027ef061712bb87ad467bb`, with its original credits and licenses.

Hero typography: [Redaction 35](https://fonts.google.com/specimen/Redaction+35) Bold 700 for the name and Regular 400 for the roles. The family has no Thin weight; Regular is the lightest available, chosen to keep both texts in the same typeface. Geist Mono remains in the ASCII and header. All fonts used permit commercial use under SIL OFL 1.1; there are no demo fonts or synthesized weights. WOFF2 files are local, preloaded, and fully loaded before the reveal; the role box follows the actual width of the longest phrase.

## Scroll to Projects

`SceneNavigation` uses GSAP Observer for virtual, scene-based scrolling. One vertical wheel/trackpad gesture or touch swipe animates the complete journey between the hero and waterfall, snapping to the destination rather than leaving the camera between scenes. The full journey lasts 3.2 seconds with a sine ease-in-out. Further gesture input is absorbed during travel instead of queuing or restarting transitions. The Projects menu button and navigation keys use the same controller; Escape settles at the nearest scene. Browser zoom, editable controls, and horizontal gestures are preserved. Reduced motion disables gesture interception and restores native scrolling with instant scene selection.

Scene selection lives only in memory: menu clicks and gestures do not change the URL or create browser history entries. Every page entry, reload, and browser return starts at the hero. Legacy fragments such as `#projects` and `#contact` are removed while preserving the path and query string. Automatic scroll restoration is disabled so it cannot reopen the waterfall after a reload.

The document retains its 220-viewport-height transition as the camera's progress source, while the scrollbar is hidden in virtual mode. The name and role fade out during the first 28%; the invisible hero becomes inert so it cannot receive keyboard focus. Resizing realigns the selected scene. Teardown kills the Observer and tween and removes listeners.

`AsciiSceneCamera` pulls back and lowers the viewing angle over the same water plane. A fixed drop edge enters from below and rises toward the top of the viewport, revealing a full-width waterfall. The ship and atmospheric layers recede and fade as the camera leaves the sea. The depth veil is inverse-projected to remain full-bleed during camera retreat, preventing rectangular color seams at the viewport edges; individual mist banks still follow the actor projection. Scrolling back restores the original camera and hero without replaying the intro.

`AsciiWaterfall` moves translucent, curved ASCII filaments down the fall instead of illuminating a rigid grid of vertical columns. Material points accelerate downward, with staggered highlights and short companion droplets. The impact uses softly blended, advected density fields for rounded foam, sparse bubble contours, low mist, ballistic spray with fine trails, and broken outward ripples. The old chevron lip and sharply peaked foam boundary are gone. Seed buffers, glyph masks, and the river's 30 fps clock are reused; there are no per-frame buffer allocations, new dependencies, or animation loops.

Mouse movement gently parts nearby waterfall droplets and carries them slightly in the pointer's direction. A damped local field eases in and out, returning drops to their undisturbed trajectories when the pointer leaves. Only filaments, spray, and fine mist respond; foam and pooled water remain unchanged. The waterfall target is separate from ship steering. Touch gestures do not activate hover forces, and reduced motion keeps the scene static. The interaction shares the existing render clock without per-particle allocations or additional listeners.

## Running locally

Node.js 22.12+.

```sh
npm install
npm run dev
```

## Production

```sh
npm run build
npm run preview
```

`npm run typecheck` runs TypeScript only. `npm run glyphs` regenerates the official logo and the per-letter variants used in the header hover effect.

`?intro=0` skips the intro, drop, and wave; it displays the header and river directly. The old scene parameters (`debug`, `t`, `webgl`) have been removed.

Projects is an in-page scene button; Contact is disabled because it has no destination yet. Neither adds URL fragments. The standalone GitHub cover files in `github-profile/` have not been changed.

## Previous verification

The scroll transition passed a production build and browser checks at 1440×900, 390×844, and after resizing to 844×390. Checks covered hero opacity and focus exclusion, reverse scrolling, the Projects anchor, finite camera projection, no horizontal overflow, and a single visible scene Canvas once the hero reveal settles. Reduced motion produced identical pixels across frames. No runtime errors were observed.

Production build completed. The actual scene was exercised in Chromium at 1440×900 and 390×844: central drop and impact preserved, water and actors in motion, a single Canvas, no overflow, resizing without replacing the Canvas, and `?intro=0`. Reduced motion keeps pixels static, and resuming does not repeat the drop. No runtime errors.

Perspective was visually checked in Chromium at 1440×900 and 390×844, including ship navigation, normal entrance, and resuming after reduced motion. An isolated native-rendering check verified projected reveal containment and wake stability and dissipation at 1440×900, 390×844, and 844×390. A four-heading contact sheet verified the oblique silhouette with upright masts. Reduced motion kept pixels static. No runtime errors were observed.

Batch rasterization reduced the median drawing cost by approximately 83% in an isolated 45-frame scenario at 1440×900. This measures drawing-call time, not FPS or GPU time. Masks preserved the antialiased coverage of the native composition, including overlaps and edge clipping (a maximum difference of one alpha level).

## Water references

- [GPU Gems — Effective Water Simulation from Physical Models](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): wave summation, analytical derivatives, and filtering.
- [Ocean waves with WebGL — Matthias Volk](https://relint.de/waves.html): dispersion, normals, and reflection's contribution to the appearance of water. The local implementation does not use FFT or WebGL.
- [Obsessed Waves — Ken Goyarola](https://kgaw.io/projects/obsessed-waves/): visual reference for ASCII continuity and depth; its code, objects, and controls were not incorporated.

