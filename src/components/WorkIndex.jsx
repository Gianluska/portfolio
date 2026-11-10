import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PROJECTS } from '../data/projects.js'
import './work.css'

const SLICES = Array.from({ length: 8 }, (_, index) => index)
const MOBILE_QUERY = '(max-width: 760px)'

export default function WorkIndex({ reducedMotion = false }) {
  const [selection, setSelection] = useState({
    index: 0, outgoing: null, revision: 0, animate: false, direction: 1,
  })
  const [horizontal, setHorizontal] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  ))
  const tabs = useRef([])
  const slices = useRef(null)

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY)
    const update = () => setHorizontal(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useLayoutEffect(() => {
    if (reducedMotion && selection.animate) {
      setSelection((current) => ({ ...current, outgoing: null, animate: false }))
      return
    }
    if (!selection.animate || !slices.current) return

    const easing = getComputedStyle(slices.current).getPropertyValue('--ease-out').trim()
      || 'cubic-bezier(0.23, 1, 0.32, 1)'
    const animations = []
    const shutters = Array.from(slices.current.children)

    // The cover stays mounted while the actual selected image changes underneath.
    // Rapid selections retarget the exposed image, never restart or queue a cover.
    shutters.forEach((shutter, index) => {
      const delay = (selection.direction > 0 ? index : SLICES.length - 1 - index) * 12
      const timing = { duration: 196, delay, easing, fill: 'both' }
      animations.push(shutter.animate([
        { transform: 'translateZ(0) rotateY(0deg)', opacity: 1 },
        { opacity: 1, offset: 0.55 },
        { transform: `translateZ(-48px) rotateY(${selection.direction * 88}deg)`, opacity: 0 },
      ], timing))
      animations.push(shutter.firstElementChild.animate([
        { opacity: 0 },
        { opacity: 0.55, offset: 0.65 },
        { opacity: 0.8 },
      ], timing))
    })

    const lastShutter = selection.direction > 0 ? shutters.length - 1 : 0
    animations[lastShutter * 2].onfinish = () => {
      setSelection((current) => current.revision === selection.revision
        ? { ...current, outgoing: null, animate: false }
        : current)
    }
    return () => animations.forEach((animation) => {
      animation.onfinish = null
      animation.cancel()
    })
  }, [selection.revision, selection.animate, selection.direction, reducedMotion])

  function select(index, animate = false) {
    setSelection((current) => {
      const shouldAnimate = animate && !reducedMotion
      if (current.index === index) {
        return !shouldAnimate && current.animate
          ? { ...current, outgoing: null, animate: false, revision: current.revision + 1 }
          : current
      }
      const continueShutter = shouldAnimate && current.animate
      return {
        index,
        outgoing: shouldAnimate ? (continueShutter ? current.outgoing : current.index) : null,
        revision: continueShutter ? current.revision : current.revision + 1,
        animate: shouldAnimate,
        direction: continueShutter ? current.direction : Math.sign(index - current.index),
      }
    })
  }

  function onTabKeyDown(event, index) {
    const previousKey = horizontal ? 'ArrowLeft' : 'ArrowUp'
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown'
    let next
    if (event.key === nextKey) next = (index + 1) % PROJECTS.length
    else if (event.key === previousKey) next = (index + PROJECTS.length - 1) % PROJECTS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = PROJECTS.length - 1
    else return

    event.preventDefault()
    select(next)
    tabs.current[next]?.focus({ preventScroll: true })
  }

  return (
    <section id="work" className="work" aria-labelledby="work-heading" data-reduced-motion={reducedMotion || undefined}>
      <h2 id="work-heading" className="work-heading">Selected work</h2>
      <div className="work-layout">
        <div
          className="work-index"
          role="tablist"
          aria-label="Selected projects"
          aria-orientation={horizontal ? 'horizontal' : 'vertical'}
        >
          {PROJECTS.map((project, index) => (
            <button
              key={project.id}
              ref={(element) => { tabs.current[index] = element }}
              type="button"
              role="tab"
              id={`work-tab-${project.id}`}
              aria-controls={`work-panel-${project.id}`}
              aria-selected={selection.index === index}
              tabIndex={selection.index === index ? 0 : -1}
              className="work-tab"
              onClick={(event) => select(index, event.detail > 0)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span className="work-tab-name">{project.title}</span>
              <span className="work-tab-year">{project.year}</span>
            </button>
          ))}
        </div>
        <div className="work-panels">
          {PROJECTS.map((project, index) => (
            <div
              key={project.id}
              id={`work-panel-${project.id}`}
              role="tabpanel"
              aria-labelledby={`work-tab-${project.id}`}
              hidden={selection.index !== index}
              tabIndex={0}
              className="work-panel"
            >
              <figure className="work-figure">
                <div className="work-media">
                  <img
                    className="work-image"
                    src={project.image}
                    width={project.imageWidth}
                    height={project.imageHeight}
                    alt={project.alt}
                    decoding="async"
                    fetchPriority="low"
                  />
                </div>
              </figure>
              <div className="work-details">
                <div className="work-description">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
                <div className="work-facts">
                  <dl>
                    <div><dt>Role</dt><dd>{project.role}</dd></div>
                    <div><dt>Year</dt><dd>{project.year}</dd></div>
                  </dl>
                  {project.collaborator && (
                    <p className="work-collaborator">With <a href={project.collaborator.url} target="_blank" rel="noreferrer">{project.collaborator.name}</a></p>
                  )}
                  <a className="work-link" href={project.url} target="_blank" rel="noreferrer">
                    {project.linkLabel}
                    <span className="work-sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
          {selection.animate && !reducedMotion && (
            <div className="work-slices" ref={slices} data-direction={selection.direction} aria-hidden="true">
              {SLICES.map((slice) => (
                <div
                  key={slice}
                  className="work-slice"
                  style={{
                    left: `${slice * 100 / SLICES.length}%`,
                    width: `${100 / SLICES.length}%`,
                    transformOrigin: `${selection.direction > 0 ? 0 : 100}% 50%`,
                  }}
                >
                  <span className="work-slice-light" />
                  <img
                    src={PROJECTS[selection.outgoing].image}
                    className="work-slice-image"
                    width={PROJECTS[selection.outgoing].imageWidth}
                    height={PROJECTS[selection.outgoing].imageHeight}
                    alt=""
                    style={{
                      width: `${SLICES.length * 100}%`,
                      left: `${-slice * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
