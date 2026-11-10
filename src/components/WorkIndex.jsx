import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PROJECTS } from '../data/projects.js'
import './work.css'

const SLICES = [0, 1, 2, 3, 4]
const MOBILE_QUERY = '(max-width: 760px)'


export default function WorkIndex({ reducedMotion = false }) {
  const [selection, setSelection] = useState({ index: 0, outgoing: null, revision: 0, animate: false })
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

    // Only the outgoing image moves; the selected project and its text are ready immediately.
    // A new selection cancels these animations rather than waiting for an exit queue.
    const animations = Array.from(slices.current.children, (slice, index) => slice.animate([
      { transform: 'translate3d(0, 0, 0)', opacity: 1 },
      { transform: `translate3d(0, ${index % 2 === 0 ? '-18px' : '18px'}, 0)`, opacity: 0 },
    ], {
      duration: 220,
      delay: index * 15,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'both',
    }))

    animations[animations.length - 1].onfinish = () => {
      setSelection((current) => current.revision === selection.revision
        ? { ...current, outgoing: null, animate: false }
        : current)
    }
    return () => animations.forEach((animation) => animation.cancel())
  }, [selection.revision, selection.animate, reducedMotion])

  function select(index, animate = false) {
    setSelection((current) => current.index === index ? current : {
      index,
      outgoing: current.index,
      revision: current.revision + 1,
      animate: animate && !reducedMotion,
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
    <section id="work" className="work" aria-labelledby="work-heading">
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
                  {selection.index === index && selection.animate && !reducedMotion && (
                    <div className="work-slices" ref={slices} aria-hidden="true">
                      {SLICES.map((slice) => (
                        <img
                          key={slice}
                          src={PROJECTS[selection.outgoing].image}
                          className="work-slice"
                          alt=""
                          style={{ clipPath: `inset(0 ${100 - (slice + 1) * 20}% 0 ${slice * 20}%)` }}
                        />
                      ))}
                    </div>
                  )}
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
        </div>
      </div>
    </section>
  )
}
