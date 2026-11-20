import { useEffect, useRef } from 'react'
import { Director } from './director'
import { glyphs } from './data/glyphs'

export default function App() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current!
    const $ = (s: string) => el.querySelector<HTMLElement>(s)!
    const director = new Director(
      {
        root: el,
        loader: $('.loader'),
        loaderLogo: $('.loader__logo'),
        river: el.querySelector<HTMLCanvasElement>('.river')!,
        portfolio: $('.portfolio'),
        hero: $('.hero'),
        projects: $('.projects'),
        ui: $('.ui'),
        header: $('.header'),
        cue: $('.cue'),
      },
    )
    director.run()
    return () => director.destroy()
  }, [])

  return (
    <div ref={root} className="app">

      <div className="loader" aria-hidden="true">
        <pre className="loader__logo">{glyphs.official.join('\n')}</pre>
      </div>

      <canvas className="river" data-state="waiting" aria-hidden="true" />


      <div className="ui">
        <header className="header" />
        <div className="cue" aria-hidden="true" />
      </div>

      <main className="scene-content">

        <section className="hero" hidden>
          <div className="hero__copy">
            <h1 className="hero__name" tabIndex={0} aria-label={'Gianlucca "lvsk" Claudino'}>
              <span className="hero__line">
                <span className="hero__text" data-hero-name aria-hidden="true">
                  Gianlucca{' '}
                  <span className="hero__nickname">
                    <span className="hero__nickname-clip">
                      <span className="hero__nickname-content">
                        <span className="hero__nickname-text">"lvsk"</span>
                        <span className="hero__nickname-noise" aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                  Claudino
                </span>
                <span className="hero__skeleton" aria-hidden="true" hidden />
              </span>
            </h1>
            <p className="hero__roles">
              <span className="sr-only">Creative Technologist, Frontend Specialist, Product Engineer.</span>
              <span className="hero__role">
                <span className="hero__line">
                  <span className="hero__text" data-hero-role aria-hidden="true">Creative Technologist</span>
                  <span className="hero__skeleton" aria-hidden="true" hidden />
                </span>
              </span>
            </p>
          </div>
        </section>

        <div className="portfolio">
          <section className="projects portfolio__inner" aria-label="Selected work">
            <h2 className="portfolio__title" data-reveal="arrival">Selected work</h2>

            <article className="project">
              <div className="project__copy" data-reveal="arrival">
                <span className="project__number" aria-hidden="true">01</span>
                <h3>lvsk-calendar</h3>
                <p>A terminal calendar for Arch Linux and Hyprland, written in Bash. Browse dates, manage events and see local holidays without leaving the keyboard.</p>
                <a className="portfolio__link" href="https://github.com/Gianluska/lvsk-calendar">View project <span className="portfolio__arrow" aria-hidden="true" /></a>
              </div>
              <figure className="project__media" data-reveal="arrival">
                <img src="/art/lvsk-calendar.webp" alt="Monthly calendar with keyboard shortcuts in a Hyprland desktop window" width="1024" height="564" loading="lazy" />
              </figure>
            </article>

            <article className="project project--reverse">
              <div className="project__copy" data-reveal>
                <span className="project__number" aria-hidden="true">02</span>
                <h3>An ocean made of text</h3>
                <p>This portfolio's sea, ship and waterfall share one Canvas 2D renderer. Characters take the place of meshes and textures.</p>
              </div>
              <figure className="project__media project__media--sea" data-reveal>
                <img src="/art/ascii-sea.webp" alt="An ASCII sailboat on a monochrome ocean rendered in Canvas 2D" width="1706" height="960" loading="lazy" />
              </figure>
            </article>

            <section className="case-study" aria-label="Building the ASCII ocean">
              <h3 data-reveal>Building the ASCII ocean</h3>
              <div className="case-study__steps">
                <div data-reveal>
                  <h4>The challenge</h4>
                  <p>Make a grid of characters feel like water in motion, with readable type above it and no video or 3D assets.</p>
                </div>
                <div data-reveal>
                  <h4>The approach</h4>
                  <p>Project a wave field onto the screen and reuse pre-rendered glyph masks. The same camera and surface carry the scene from sea to waterfall.</p>
                </div>
                <div data-reveal>
                  <h4>The result</h4>
                  <p>One visible canvas handles the water and its actors, capped at 30 frames per second. Reduced motion keeps both scenes still.</p>
                </div>
              </div>
              <a className="portfolio__link" href="https://github.com/Gianluska/portfolio" data-reveal>View source <span className="portfolio__arrow" aria-hidden="true" /></a>
            </section>
          </section>

          <section className="profile portfolio__inner" aria-label="About me">
            <h2 className="portfolio__title" data-reveal>About me</h2>
            <p data-reveal>I'm Gianlucca Claudino, a frontend engineer working with React and TypeScript. I’m interested in how design systems, frontend architecture and creative coding shape the way people use the web.</p>
          </section>

          <footer className="contact portfolio__inner" aria-label="Get in touch">
            <h2 className="portfolio__title" data-reveal>Get in touch</h2>
            <ul className="contact__links" data-reveal>
              <li><a className="portfolio__link" href="mailto:gianluccaclaudino@gmail.com">Email</a></li>
              <li><a className="portfolio__link" href="https://www.linkedin.com/in/gianlucca-claudino/">LinkedIn</a></li>
              <li><a className="portfolio__link" href="https://github.com/Gianluska">GitHub</a></li>
            </ul>
          </footer>
        </div>
      </main>
    </div>
  )
}
