import { Component, Suspense, lazy, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Director } from './director'
import { deferred, env } from './lib/env'
import type { Stage } from './scene/store'

const SceneCanvas = lazy(() => import('./scene/Scene'))

const ROLES = ['Creative Technologist', 'Frontend Specialist', 'Product Engineer']
const LINKS = [
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
]

/** Se o WebGL falhar (ou o chunk da cena não carregar), a página segue sem a cena. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[lvsk] WebGL indisponível, seguindo sem a cena.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  const [scene] = useState(() => deferred<Stage | null>())

  useEffect(() => {
    const el = root.current!
    const $ = (s: string) => el.querySelector<HTMLElement>(s)!
    const $$ = (s: string) => [...el.querySelectorAll<HTMLElement>(s)]
    const director = new Director(
      {
        loader: $('.loader'),
        loaderLogo: $('.loader__logo'),
        canvas: $('.stage'),
        ui: $('.ui'),
        header: $('.header'),
        headerLink: $('.header__home'),
        headerLogo: $('.header__logo'),
        links: $$('.nav__link'),
        navItems: $$('.nav__item'),
        names: $$('.mask__in'),
        role: $('.role'),
        details: $('.hero__details'),
      },
      ROLES,
      scene.promise,
    )
    director.run()
    return () => director.destroy()
  }, [scene])

  return (
    <div ref={root} className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <div className="loader" aria-hidden="true">
        <div className="loader__logo" />
      </div>

      <div className="stage" aria-hidden="true">
        {!env.noWebGL && (
          <SceneBoundary onError={() => scene.resolve(null)}>
            <Suspense fallback={null}>
              <SceneCanvas onReady={scene.resolve} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

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

        <main className="hero" id="main" tabIndex={-1}>
          <div className="hero__identity">
            <h1 className="hero__name">
              <span className="mask"><span className="mask__in">Gianlucca</span></span>{' '}
              <span className="mask"><span className="mask__in">Claudino<span className="hero__period">.</span></span></span>
            </h1>
            <p className="hero__role">
              <span className="role" aria-hidden="true">Creative Technologist</span>
              <span className="sr-only">{ROLES.join(', ')}</span>
            </p>
          </div>
          <div className="hero__details">
            <p>Frontend engineering meets<br />product &amp; creative technology.</p>
          </div>
        </main>
      </div>
    </div>
  )
}
