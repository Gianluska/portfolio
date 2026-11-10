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

- **Hero:** the original ASCII signature becomes a five-layer beveled metal sculpture, with perspective compensation, fine-pointer parallax and native-scroll choreography.
- **Work:** three real projects, accessible keyboard-operated tabs, immediate project details and interruptible image-slice transitions.
- **Contact:** the same sculpture opens around a public email address. `Email me` opens the mail client; `Copy email` confirms successful copying and handles unavailable clipboard access.
- **Accessibility:** HTML content remains independent of WebGL. Dynamic reduced-motion preferences remove spatial movement and image transitions. Lost context or initialization errors switch to a real rendered poster without disabling work or contact.

The 3D module is lazy-loaded. Font, environment, geometry, project media and posters are self-hosted; runtime rendering does not depend on GitHub, font CDNs or external HDR assets. The canvas uses demand rendering and pauses while the document is hidden.

## Files

- `src/App.jsx`: page composition and artwork error boundary.
- `src/scene/`: original glyph outlines, merged layered geometry, lighting and scene lifecycle.
- `src/components/WorkIndex.jsx` and `src/data/projects.js`: project navigation and factual content.
- `src/components/Contact.jsx` and `src/data/identity.js`: contact behavior, signature and public professional links.
- `src/hooks/useReducedMotion.js`: reactive OS motion preference.
- `src/style.css` and `src/components/work.css`: responsive monochrome presentation.
- `PORTFOLIO_PLAN.md`: the approved experience plan.

## Content and licenses

Work uses the author's public projects: [Grass experiment](https://github.com/Gianluska/lab-grass-experiment), [lvsk-calendar](https://github.com/Gianluska/lvsk-calendar), and [BTConverter](https://github.com/Gianluska/btconverter-website). BTConverter explicitly credits co-development with Dayhele.

Project screenshots are actual live captures or original repository media, not generated stand-ins. Origins, capture methods, factual evidence and original MIT notices are in `public/work/provenance.json` and the adjacent license files.

Contact details come from the author's [public GitHub profile README](https://github.com/Gianluska/gianluska). The site has no email-sending backend, tracking service or contact form.

JetBrains Mono is bundled under the SIL Open Font License; see `public/fonts/OFL.txt`. `public/scene-poster.webp` and `public/scene-poster-mobile.webp` are actual captures of this portfolio's WebGL sculpture, with interface elements hidden during capture.

## Verification

The application was exercised in a Chromium browser at desktop and portrait mobile sizes: real media loading, project selection by pointer and arrow/Home/End keys, rapid selection changes, email copying, reduced-motion interaction and real WebGL context loss with working HTML content and poster fallback.

Production builds still emit Vite's large-chunk advisory for the lazy 3D bundle. Performance targets in the plan are targets, not measured Core Web Vitals results; physical-device and GPU-specific profiling remain separate from these browser smoke checks.
