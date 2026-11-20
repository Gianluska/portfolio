import { useLayoutEffect, useRef, useState } from 'react'

const quests = [
  {
    company: 'Hyperlocal',
    logo: '/art/hyperlocal.svg',
    stack: ['React'],
    prompt: 'Hey dude, want to build a digital bank from scratch?',
    replies: ['Say no more.', 'Huh?'],
    comeback: 'A bank. The digital kind.',
    work: 'Helped build the frontend for a digital bank from scratch.',
  },
  {
    company: 'Grupo Boticário',
    logo: '/art/grupo-boticario.svg',
    stack: ['React', 'Backstage', 'Material UI'],
    prompt: 'Seven days per component. You have twenty minutes.',
    replies: ['Put it in the cauldron.', 'Is this witchcraft?'],
    comeback: 'Officially, it’s Backstage.',
    work: 'Helped build Alquimia, an internal platform that cut component setup from seven days to twenty minutes.',
  },
  {
    company: 'GLS.AI',
    logo: '/art/gls-solutions.svg',
    stack: ['Ruby on Rails', 'Tailwind CSS'],
    prompt: 'Can you remodel a moving train? Cool. It’s a Rails app.',
    replies: ['Hand me the Tailwind.', 'Can we stop the train?'],
    comeback: 'Only in staging.',
    work: 'Built and maintained responsive interfaces for a Ruby on Rails application.',
  },
] as const

type Quest = typeof quests[number]

const portraitTexture = `
               . .   .                
          .  . . : . . . .            
      .    . : : : : : : .   .        
        . . : : + + + : : . .   .     
     . . : : + + = + + + : : . .      
   . . : : + + = = = + + : : . . .    
   . . : : + + = = = + + : : . . .    
     . . : : + + = + + + : : . .      
        . . : : + + + : : . .   .     
      .    . : : : : : : .   .        
          .  . . : . . . .            
               . .   .`

function QuestCard({ quest, index, active }: { quest: Quest; index: number; active: boolean }) {
  const [reply, setReply] = useState(0)

  return (
    <div className="quest" role="group" aria-roledescription="slide"
      aria-label={`${index + 1} of ${quests.length}`} inert={!active}>
      <div className="quest__scene">
        <span className="quest__seam" aria-hidden="true" />
        <div className="quest__company">
          <div className="quest__identity">
            <div className="quest__portrait" aria-hidden="true">
              <pre>{portraitTexture}</pre>
              <img src={quest.logo} alt="" width="176" height="80" />
            </div>
            <h3>{quest.company}</h3>
          </div>
          <dl className="quest__stack">
            <dt className="sr-only">Tech stack</dt>
            <dd>{quest.stack.join(' · ')}</dd>
          </dl>
        </div>

        <div className="quest__dialogue">
          <blockquote>“{quest.prompt}”</blockquote>
          <div className="quest__replies" role="group" aria-label="Dialogue choices">
            {quest.replies.map((text, choice) => (
              <button key={text} type="button" className="quest__reply" aria-pressed={reply === choice}
                onClick={() => setReply(choice)}>
                <span className="quest__reply-mark" aria-hidden="true" />
                <span>{text}{choice === 0 && <span className="sr-only"> (original reply)</span>}</span>
              </button>
            ))}
            <div className="quest__echo" role="status">
              {reply === 1 && <span><strong>{quest.company}:</strong> {quest.comeback}</span>}
            </div>
          </div>
        </div>
      </div>

      <dl className="quest__work">
        <dt>What I did</dt>
        <dd>{quest.work}</dd>
      </dl>
    </div>
  )
}

const formatIndex = (value: number) => String(value).padStart(2, '0')
const lastIndex = quests.length - 1
const clampIndex = (index: number) => Math.max(0, Math.min(lastIndex, index))
const visibleIndex = (track: HTMLElement) => clampIndex(Math.round(track.scrollLeft / (track.clientWidth || 1)))

export function QuestLog() {
  const viewport = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [destination, setDestination] = useState<number | null>(null)
  const navigationIndex = destination ?? active

  useLayoutEffect(() => {
    const track = viewport.current
    if (!track) return
    // Layout and scroll restoration can change which slide is visible without a scroll event.
    const sync = () => setActive(visibleIndex(track))
    sync()
    const resize = new ResizeObserver(sync)
    resize.observe(track)
    return () => resize.disconnect()
  }, [])

  function move(step: number, animate = false) {
    const track = viewport.current
    if (!track) return
    const from = destination ?? visibleIndex(track)
    const next = clampIndex(from + step)
    if (next === from) return

    const left = (track.children[next] as HTMLElement).offsetLeft
    const smooth = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches
    setDestination(smooth && Math.abs(track.scrollLeft - left) > 1 ? next : null)
    track.scrollTo({ left, behavior: smooth ? 'smooth' : 'instant' })
  }

  return (
    <div className="quest-log" role="group" aria-roledescription="carousel" aria-label="Company experiences">
      <span className="sr-only" role="status">Quest {active + 1} of {quests.length}: {quests[active].company}</span>
      <div className="quest-log__viewport" id="quest-slides" ref={viewport} tabIndex={0}
        role="group" aria-label="Quest slides"
        onScroll={({ currentTarget: track }) => {
          setActive(visibleIndex(track))
          if (destination !== null &&
              Math.abs(track.scrollLeft - (track.children[destination] as HTMLElement).offsetLeft) <= 1) {
            setDestination(null)
          }
        }}
        onScrollEnd={() => setDestination(null)}
        onPointerDown={() => setDestination(null)}
        onWheel={(event) => {
          if (event.deltaX || event.shiftKey) setDestination(null)
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }}>
        {quests.map((quest, index) => (
          <QuestCard key={quest.company} quest={quest} index={index} active={index === active} />
        ))}
      </div>
      <div className="quest-log__nav">
        <button type="button" aria-label="Previous quest" aria-controls="quest-slides"
          className="quest-log__prev" aria-disabled={navigationIndex === 0}
          onClick={(event) => move(-1, event.detail > 0)}>
          <span className="portfolio__arrow" aria-hidden="true" />
        </button>
        <span className="quest-log__count" aria-hidden="true">
          <strong>{formatIndex(active + 1)}</strong> / {formatIndex(quests.length)}
        </span>
        <button type="button" aria-label="Next quest" aria-controls="quest-slides"
          aria-disabled={navigationIndex === lastIndex} onClick={(event) => move(1, event.detail > 0)}>
          <span className="portfolio__arrow" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
