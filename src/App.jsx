import { Component, Suspense, lazy, useCallback, useState } from 'react'
import useReducedMotion from './hooks/useReducedMotion.js'
import Contact from './components/Contact.jsx'
import WorkIndex from './components/WorkIndex.jsx'
import { ASCII_LOGO } from './data/identity.js'

const ExperienceCanvas = lazy(() => import('./scene/ExperienceCanvas.jsx'))

class ArtworkBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(false)
  const [contactActive, setContactActive] = useState(false)
  const handleReady = useCallback(() => setSceneReady(true), [])
  const handleError = useCallback(() => {
    setSceneFailed(true)
    setSceneReady(false)
  }, [])

  return (
    <>
      <a className="skip-link" href="#work">Skip to work</a>

      <div className={`artwork ${sceneReady ? 'artwork--ready' : ''}`} aria-hidden="true">
        <div className="scene-poster" />
        {!sceneFailed && (
          <div className="experience-layer">
            <ArtworkBoundary onError={handleError}>
              <Suspense fallback={null}>
                <ExperienceCanvas
                  reducedMotion={reducedMotion}
                  contactActive={contactActive}
                  onReady={handleReady}
                  onError={handleError}
                />
              </Suspense>
            </ArtworkBoundary>
          </div>
        )}
      </div>

      <header className="site-header">
        <a className="brand" href="#hero" aria-label="lvsk. home">
          <pre aria-hidden="true">{ASCII_LOGO}</pre>
        </a>
        <nav aria-label="Main navigation">
          <a className="text-link" href="#work">Work</a>
          <a className="text-link" href="#contact">Contact</a>
        </nav>
      </header>

      <main className={sceneReady ? undefined : 'static-artwork'}>
        <section className="hero" id="hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <h1 id="hero-heading">Creative<br />technologist.</h1>
            <p>I build immersive web experiences.</p>
          </div>
          <span className="hero-signature" aria-hidden="true">lvsk.</span>
          <span className="sr-only">
            A kinetic architectural aperture. Continuous metal frames bend into a
            deep, twisting passage that responds to the pointer.
          </span>
        </section>

        <WorkIndex reducedMotion={reducedMotion} />
        <Contact onActiveChange={setContactActive} />
      </main>
    </>
  )
}
