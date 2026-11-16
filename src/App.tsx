import { useEffect, useRef, type CSSProperties } from 'react'
import { Director } from './director'
import { glyphs } from './data/glyphs'
const LINKS = [
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
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
              {LINKS.map(({ href, label }) => (
                <li className="nav__item" key={href}>
                  <a className="nav__link" href={href}>
                    <span className="nav__label" data-label>
                      {label}
                    </span>
                    <span className="nav__line" aria-hidden="true">
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <i key={i} style={{ '--i': i } as CSSProperties} />
                      ))}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="hero" aria-labelledby="hero-name" hidden>
          <div className="hero__copy">
            <h1 id="hero-name" className="hero__name">
              <span className="hero__line">
                <span className="hero__text" data-hero-name>Gianlucca Claudino</span>
                <span className="hero__skeleton" aria-hidden="true" hidden />
              </span>
            </h1>
            <p className="hero__roles">
              <span className="sr-only">Creative Technologist, Frontend Specialist, Product Engineer.</span>
              <button className="hero__role" type="button" aria-label="Pause role animation" aria-pressed="false">
                <span className="hero__line">
                  <span className="hero__text" data-hero-role aria-hidden="true">Creative Technologist</span>
                  <span className="hero__skeleton" aria-hidden="true" hidden />
                </span>
              </button>
            </p>
          </div>
        </main>

      </div>
    </div>
  )
}
