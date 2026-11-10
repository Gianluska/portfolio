# lvsk.

Monochrome portfolio for Gianlucca Claudino, Creative Technologist. Built with React, Vite, React Three Fiber and Three.js.

## Run

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

## Experience

- **Hero:** an original architectural aperture built from 56 continuous, beveled metal frames. Pointer input changes the bend, twist and viewpoint of the volume. The ASCII identity stays flat and readable in the header.
- **Work:** three real projects, accessible keyboard-operated tabs, immediate project details and interruptible image-slice transitions.
- **Contact:** the same sculpture opens around a public email address. `Email me` opens the mail client; `Copy email` confirms successful copying and handles unavailable clipboard access.
- **Accessibility:** HTML content remains independent of WebGL. Dynamic reduced-motion preferences remove spatial movement and image transitions. Lost context or initialization errors switch to a real rendered poster without disabling work or contact.

The 3D module is lazy-loaded. Font, environment, geometry, project media and posters are self-hosted; runtime rendering does not depend on GitHub, font CDNs or external HDR assets. The canvas uses demand rendering and pauses while the document is hidden.

## Files

- `src/App.jsx`: page composition and artwork error boundary.
- `src/scene/`: instanced parametric aperture geometry, a locally generated softbox environment, lighting and scene lifecycle.
- `src/components/WorkIndex.jsx` and `src/data/projects.js`: project navigation and factual content.
- `src/components/Contact.jsx` and `src/data/identity.js`: contact behavior, signature and public professional links.
- `src/hooks/useReducedMotion.js`: reactive OS motion preference.
- `src/style.css` and `src/components/work.css`: responsive monochrome presentation.
- `PORTFOLIO_PLAN.md`: experience brief and the revised visual direction.

## Content and licenses

Work uses the author's public projects: [Grass experiment](https://github.com/Gianluska/lab-grass-experiment), [lvsk-calendar](https://github.com/Gianluska/lvsk-calendar), and [BTConverter](https://github.com/Gianluska/btconverter-website). BTConverter explicitly credits co-development with Dayhele.

Project screenshots are actual live captures or original repository media, not generated stand-ins. Origins, capture methods, factual evidence and original MIT notices are in `public/work/provenance.json` and the adjacent license files.

Contact details come from the author's [public GitHub profile README](https://github.com/Gianluska/gianluska). The site has no email-sending backend, tracking service or contact form.

JetBrains Mono is bundled under the SIL Open Font License; see `public/fonts/OFL.txt`. `public/scene-poster.webp` and `public/scene-poster-mobile.webp` are actual captures of this portfolio's WebGL sculpture, with interface elements hidden during capture.

## Visual references

The rejected literal ASCII extrusion was replaced after studying [Lusion](https://lusion.co/), [Unseen Studio](https://unseen.co/), [Dennis Snellenberg](https://dennissnellenberg.com/) and [Bruno Simon's author-written case study](https://www.awwwards.com/brunos-portfolio-case-study.html).

Lusion informed separation between interface and spatial craft; Unseen informed architectural depth and lighting; Dennis informed hierarchy; Bruno informed interaction coherence. The geometry, lighting and imagery shipped here are original, not copied assets. Lusion, Unseen and Dennis were inspected live through Playwright MCP; Bruno's technical reference was researched from the author-written case study.

## Verification

Version 0.3.0 was exercised through the official **Playwright MCP** server in isolated Chromium sessions, not just through source assertions:

- Native navigation links and project-tab pointer/arrow/Home/End interactions.
- Rapid project changes during active image transitions, with the final media and project details checked.
- Native clipboard success and a deliberately denied clipboard operation, including recovery messaging.
- Dynamic reduced-motion emulation, non-moving project transitions, and an observed idle interval without GPU draws.
- A browser started with WebGL disabled before application initialization; the actual rendered poster, work navigation and mail link remained functional.
- Actual context loss through `WEBGL_lose_context`, with the canvas removed and HTML content preserved.
- Real desktop and portrait screenshots. Both committed posters were captured directly through Playwright MCP with the interface temporarily hidden.
- Production layout at 320×740, 390×844, 768×1024, 1280×800 and 1440×900, with no horizontal overflow or header overlap.
- The production work anchor, visible laptop project action, and native opening of the real project in a new tab.
- All production resource requests returned HTTP 200; the normal production page had no console errors. The deliberately disabled-WebGL session emitted expected renderer errors and still passed the fallback checks.

Production builds still emit Vite's large-chunk advisory for the lazy 3D bundle. Performance targets in the plan are targets, not measured Core Web Vitals results; physical-device and GPU-specific profiling remain separate from these browser checks.

