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

const questFocus = 'focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white'
const questNavButton = `${questFocus} grid size-11 cursor-pointer place-items-center border-0 bg-transparent p-0 text-white aria-disabled:cursor-default aria-disabled:text-[#757575] [&:not([aria-disabled=true]):hover]:bg-[#191919]`
const questArrow = 'relative w-[0.95rem] border-t border-current after:absolute after:-top-1 after:right-0 after:aspect-square after:w-[0.45rem] after:rotate-45 after:border-current after:border-solid after:[border-width:1px_1px_0_0]'

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
    <div className="grid min-w-0 snap-start snap-always grid-rows-[1fr_auto]
      supports-[grid-template-rows:subgrid]:[grid-row:span_2] supports-[grid-template-rows:subgrid]:grid-rows-subgrid
      motion-safe:quest-ink:[view-timeline:--quest-page_inline]" role="group" aria-roledescription="slide"
      aria-label={`${index + 1} of ${quests.length}`} inert={!active}>
      <div className="relative grid grid-cols-[minmax(10rem,0.31fr)_minmax(0,1fr)] items-start gap-[clamp(2rem,5vw,5rem)]
        border border-[#6b6b6b] bg-[#111] p-[clamp(1.125rem,3.5vw,3.25rem)]
        [box-shadow:inset_0_0_0_4px_#111,inset_0_0_0_5px_#434343]
        before:pointer-events-none before:absolute before:-inset-px before:quest-corners
        compact:grid-cols-[minmax(0,1fr)] compact:gap-6">
        <span className="pointer-events-none absolute inset-0
          motion-safe:quest-ink:before:quest-seam-ink motion-safe:quest-ink:before:start-0 motion-safe:quest-ink:before:[animation-name:quest-leading-ink]
          motion-safe:quest-ink:after:quest-seam-ink motion-safe:quest-ink:after:end-0 motion-safe:quest-ink:after:[animation-name:quest-trailing-ink]" aria-hidden="true" />
        <div className="min-w-0 max-w-[13rem] text-center compact:flex compact:max-w-none compact:items-center compact:gap-[clamp(0.75rem,4vw,1.5rem)] compact:text-start">
          <div className="compact:flex-[0_0_clamp(6.75rem,40%,9rem)]">
            <div className="relative isolate grid min-h-[8.5rem] place-items-center overflow-hidden border border-[#565656] bg-[#090909] outline-1 outline-offset-[-5px] outline-[#292929] compact:min-h-[4.25rem]" aria-hidden="true">
              <pre className="absolute top-1/2 left-1/2 m-0 [translate:-50%_-50%] font-mono text-[0.625rem]/[0.65rem] font-normal text-[#515151] select-none compact:text-[0.4375rem]/[0.3125rem]">{portraitTexture}</pre>
              <img className="h-15 w-[84%] object-contain [filter:brightness(0)_invert(1)_drop-shadow(0_2px_8px_#000)] compact:h-[2.125rem]" src={quest.logo} alt="" width="176" height="80" />
            </div>
            <h3 className="relative mx-auto mt-[-0.75rem] mb-0 w-fit max-w-full border border-[#565656] bg-[#161616] px-[0.7rem] py-[0.3rem]
              font-display text-[clamp(1.125rem,1.75vw,1.5rem)]/[1.15] font-bold text-balance text-[#eee] compact:px-[0.4rem] compact:text-center">{quest.company}</h3>
          </div>
          <dl className="m-0 mt-3.5 font-mono text-xs/[1.5] font-normal text-pretty text-muted compact:mt-0 compact:mb-2">
            <dt className="sr-only">Tech stack</dt>
            <dd className="m-0">{quest.stack.join(' · ')}</dd>
          </dl>
        </div>

        <div>
          <blockquote className="m-0 mb-[clamp(1.125rem,2.75vw,2rem)] max-w-[31ch] font-display text-[clamp(2rem,4.25vw,3.625rem)]/[1.05] font-normal tracking-[-0.025em] text-pretty">“{quest.prompt}”</blockquote>
          <div className="grid max-w-[27rem]" role="group" aria-label="Dialogue choices">
            {quest.replies.map((text, choice) => (
              <button key={text} type="button" className={`${questFocus} group/reply grid min-h-11 cursor-pointer grid-cols-[0.875rem_minmax(0,1fr)]
                items-center gap-3 border-0 bg-transparent px-3 py-1.5 text-start font-sans text-base/[1.3] font-medium text-[#bdbdbd]
                [&:not([aria-pressed=true]):hover]:bg-[#1b1b1b] [&:hover]:text-white aria-pressed:bg-[linear-gradient(90deg,#2c2c2c,transparent)] aria-pressed:text-white`}
                aria-pressed={reply === choice} onClick={() => setReply(choice)}>
                <span className="grid place-items-center before:aspect-square before:w-1.5 before:rotate-45 before:border-current before:border-solid
                  before:[border-width:1px_1px_0_0] group-aria-pressed/reply:before:h-1.5 group-aria-pressed/reply:before:w-2.5
                  group-aria-pressed/reply:before:-rotate-45 group-aria-pressed/reply:before:[border-width:0_0_2px_2px]" aria-hidden="true" />
                <span>{text}{choice === 0 && <span className="sr-only"> (original reply)</span>}</span>
              </button>
            ))}
            <div className="text-sm/[1.4] text-[#c6c6c6] not-empty:ms-3 not-empty:mt-2 not-empty:border-s not-empty:border-[#777] not-empty:ps-3" role="status">
              {reply === 1 && <span><strong>{quest.company}:</strong> {quest.comeback}</span>}
            </div>
          </div>
        </div>
      </div>

      <dl className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-4 pb-1 text-[0.9375rem]/[1.5] text-[#c6c6c6]">
        <dt className="font-mono text-xs/[1.3] font-medium text-muted">What I did</dt>
        <dd className="m-0">{quest.work}</dd>
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
    <div className="mt-[clamp(1.75rem,4vw,3rem)] max-w-[74rem]" role="group" aria-roledescription="carousel" aria-label="Company experiences">
      <span className="sr-only" role="status">Quest {active + 1} of {quests.length}: {quests[active].company}</span>
      <div className={`${questFocus} relative grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col overflow-x-auto overscroll-x-contain
        [scrollbar-width:none] supports-[grid-template-rows:subgrid]:grid-rows-[auto_auto]`} id="quest-slides" ref={viewport} tabIndex={0}
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
      <div className="flex items-center justify-end gap-1.5 font-mono text-xs/[1.4] font-medium text-muted">
        <button type="button" aria-label="Previous quest" aria-controls="quest-slides"
          className={questNavButton} aria-disabled={navigationIndex === 0}
          onClick={(event) => move(-1, event.detail > 0)}>
          <span className={`${questArrow} rotate-180`} aria-hidden="true" />
        </button>
        <span className="whitespace-nowrap" aria-hidden="true">
          <strong className="font-semibold text-white">{formatIndex(active + 1)}</strong> / {formatIndex(quests.length)}
        </span>
        <button type="button" aria-label="Next quest" aria-controls="quest-slides"
          className={questNavButton} aria-disabled={navigationIndex === lastIndex} onClick={(event) => move(1, event.detail > 0)}>
          <span className={questArrow} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
