import { useEffect, useRef, type CSSProperties } from 'react'
import { Director } from './director'
import { glyphs } from './data/glyphs'
const NAV_ITEMS = [
  { scene: 'projects', label: 'Projects', available: true },
  { scene: 'contact', label: 'Contact', available: false },
]


export default function App() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current!
    const $ = (s: string) => el.querySelector<HTMLElement>(s)!
    const $$ = (s: string) => [...el.querySelectorAll<HTMLElement>(s)]
    const director = new Director(
      {
        loader: $('.loader'),
        loaderLogo: $('.loader__logo'),
        river: el.querySelector<HTMLCanvasElement>('.river')!,
        hero: $('.hero'),
        projects: $('#projects'),
        ui: $('.ui'),
        header: $('.header'),
        headerLink: $('.header__home'),
        headerLogo: $('.header__logo'),
        links: $$('.nav__link'),
        navItems: $$('.nav__item'),
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
        <header className="header">
          <a className="header__home" href="/" aria-label="lvsk, home">
            <span className="header__logo" />
          </a>
          <nav aria-label="Main">
            <ul className="nav">
              {NAV_ITEMS.map(({ scene, label, available }) => (
                <li className="nav__item" key={scene}>
                  <button className="nav__link" type="button" data-scene={scene}
                    aria-controls={available ? scene : undefined} disabled={!available}>
                    <span className="nav__label" data-label>
                      {label}
                    </span>
                    <span className="nav__line" aria-hidden="true">
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <i key={i} style={{ '--i': i } as CSSProperties} />
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </header>
      </div>

      <main className="scene-content">

        <section className="hero" aria-labelledby="hero-name" hidden>
          <div className="hero__copy">
            <h1 id="hero-name" className="hero__name" tabIndex={0} aria-label={'Gianlucca "lvsk" Claudino'}>
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

        <section id="projects" className="projects" aria-labelledby="projects-title">
          <h2 id="projects-title">Projects</h2>
        </section>
      </main>
    </div>
  )
}
