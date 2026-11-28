import { useEffect, useRef } from 'react'
import { Director } from './director'
import { glyphs } from './data/glyphs'
import { work } from './data/work'

const heroLine = 'hero__line relative block w-full'
const skeletonOverlay = 'absolute inset-0 overflow-hidden [--ars-radius:0px] [clip-path:inset(0_100%_0_0)] text-left leading-none font-ascii font-normal [&_:is(.ars,.ars-block)]:size-full'
const heroSkeleton = `hero__skeleton ${skeletonOverlay} tracking-normal [&[hidden]]:hidden`

const noteFields = [
  ['period', 'Period'], ['role', 'Role'], ['summary', 'Summary'], ['stack', 'Stack'], ['link', 'Link'],
] as const

const sceneButton = 'scene-button pointer-events-auto absolute inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] mx-auto flex min-h-11 w-fit cursor-pointer items-center gap-2 border-0 bg-transparent px-3 font-mono text-xs text-scene-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-scene-ink'

function ScrollArrow({ up = false }: { up?: boolean }) {
  return (
    <svg className={up ? 'rotate-180' : undefined} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 1v9M2 6l4 4 4-4" fill="none" stroke="currentColor" />
    </svg>
  )
}

export default function App() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current!
    const $ = (s: string) => el.querySelector<HTMLElement>(s)!
    const director = new Director(
      {
        loader: $('.loader'),
        loaderLogo: $('.loader__logo'),
        field: el.querySelector<HTMLCanvasElement>('.field')!,
        hero: $('.hero'),
        meadow: $('.meadow-view'),
        space: $('.space-view'),
      },
    )
    director.run()
    return () => director.destroy()
  }, [])

  return (
    <div ref={root}>

      <div className="loader group/loader fixed inset-0 z-1 grid place-items-center bg-scene [&[hidden]]:hidden" aria-hidden="true">
        <pre className="loader__logo invisible m-0 font-mono text-[clamp(9px,1.5vw,24px)]/[1.1] font-normal whitespace-pre text-scene-ink
          [font-kerning:none] [font-variant-ligatures:none] select-none group-[.is-on]/loader:visible">{glyphs.official.join('\n')}</pre>
      </div>

      <canvas className="field pointer-events-none fixed inset-0 z-0 block size-full data-[state=waiting]:invisible" data-state="waiting" aria-hidden="true" />


      <main className="min-h-[calc(100dvh+112px)]">
        <section className="meadow-view pointer-events-none fixed inset-0 z-3 outline-none" tabIndex={-1} aria-labelledby="meadow-title">
          <div className="hero peer absolute inset-x-page top-[60svh] grid -translate-y-1/2 justify-items-center text-center [&[hidden]]:grid [&[hidden]]:invisible" hidden>
            <div className="pointer-events-auto relative w-fit max-w-full [--ascii-font:var(--font-ascii)] [--ascii-skeleton:currentColor] [font-synthesis:none]">
              <h1 className="hero__name group/nickname m-0 font-display text-[clamp(24px,min(6.8vw,9svh),96px)]/[1.05] font-bold tracking-[-0.01em]
                whitespace-normal text-scene-ink focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-scene-ink" id="meadow-title" tabIndex={0} aria-label={'Gianlucca "lvsk" Claudino'}>
                <span className={heroLine}>
                  <span className="hero__text block" data-hero-name aria-hidden="true">
                    Gianlucca{' '}
                    <span className="inline-grid grid-cols-[0fr] align-baseline text-[0.9em] text-scene-soft
                      [transition:grid-template-columns_400ms_var(--ease-scene)] group-[.is-nickname-open]/nickname:grid-cols-[1fr] motion-reduce:transition-none">
                      <span className="min-w-0 overflow-hidden">
                        <span className="hero__nickname-content relative me-[0.25em] block w-max origin-left opacity-0
                          [transform:translateY(3px)_scale(0.96)] [transition:opacity_200ms_var(--ease-scene),transform_400ms_var(--ease-scene)]
                          group-[.is-nickname-open]/nickname:opacity-100 group-[.is-nickname-open]/nickname:[transform:none]
                          motion-reduce:transition-none motion-reduce:[transform:none]">
                          <span className="hero__nickname-text">"lvsk"</span>
                          <span className={`hero__nickname-noise ${skeletonOverlay} text-[10px] motion-reduce:hidden`} aria-hidden="true" />
                        </span>
                      </span>
                    </span>
                    Claudino
                  </span>
                  <span className={`${heroSkeleton} text-[12px]`} aria-hidden="true" hidden />
                </span>
              </h1>
              <p className="m-0 mt-[clamp(8px,0.8vw,12px)]">
                <span className="sr-only">Creative Technologist, Frontend Specialist, Product Engineer.</span>
                <span className="hero__role inline-grid place-items-center text-center font-display text-[clamp(16px,min(5.7vw,4svh),32px)]/[1.35] text-scene-muted">
                  <span className={`${heroLine} [grid-area:1/1]`}>
                    <span className="hero__text block" data-hero-role aria-hidden="true">Creative Technologist</span>
                    <span className={`${heroSkeleton} text-[10px]`} aria-hidden="true" hidden />
                  </span>
                </span>
              </p>
            </div>
          </div>
          <button type="button" className={`${sceneButton} peer-[&[hidden]]:invisible`}>
            Ascend <ScrollArrow />
          </button>
        </section>

        <section className="space-view pointer-events-none fixed inset-0 z-3 overflow-hidden opacity-0 outline-none
          [&.is-orbiting]:pointer-events-auto [&.is-orbiting]:touch-none [&.is-dragging]:cursor-grabbing [&.is-dragging]:select-none" tabIndex={-1} aria-labelledby="space-title" inert>
          <h2 id="space-title" className="sr-only">Experience</h2>
          <ol className="orbit-list m-0 list-none p-0" aria-label="Companies, use the arrow keys to turn">
            {work.map((item, i) => (
              <li key={item.name} className="orbit-item invisible absolute top-0 left-0 size-0">
                <button type="button" className="group/item absolute top-0 left-0 grid -translate-x-1/2 -translate-y-[6px] cursor-pointer justify-items-center gap-[10px]
                  border-0 bg-transparent p-1 font-mono text-[11px]/none tracking-[0.08em] whitespace-nowrap text-scene-muted uppercase
                  hover:text-scene-ink focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-scene-ink aria-[current=true]:text-scene-ink" tabIndex={i === 0 ? 0 : -1} aria-current={i === 0}>
                  <span className="orbit-item__dot block size-[5px] rounded-full bg-current shadow-[0_0_0_2px_rgb(var(--scene-rgb))] [transition:transform_300ms_var(--ease-scene)]
                    group-aria-[current=true]/item:scale-[2.25] group-aria-[current=true]/item:bg-transparent group-aria-[current=true]/item:outline-1 group-aria-[current=true]/item:-outline-offset-1 group-aria-[current=true]/item:outline-current" aria-hidden="true" />
                  <span className="orbit-item__label block bg-scene px-[5px] py-[3px]">
                    <span aria-hidden="true">{String(i + 1).padStart(2, '0')} </span>{item.name}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <article className="orbit-focus pointer-events-none absolute inset-0" aria-labelledby="orbit-title">
            <svg className="orbit-chart absolute inset-0 size-full overflow-visible text-scene-ink" aria-hidden="true" />
            <dl className="orbit-notes m-0">
              {noteFields.map(([key, term]) => (
                <div key={key} className="orbit-note invisible absolute top-0 left-0 max-w-[34ch]" data-note={key}>
                  <dt className="sr-only">{term}</dt>
                  <dd className={key === 'summary'
                    ? 'm-0 font-display text-[clamp(14px,1.15vw,17px)]/[1.35] text-balance text-scene-ink'
                    : 'm-0 font-mono text-[11px]/[1.4] tracking-[0.08em] text-scene-muted uppercase'}>
                    {key === 'link'
                      ? <a className="pointer-events-auto text-scene-ink underline decoration-1 underline-offset-4 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-scene-ink" href="#" />
                      : null}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="orbit-title absolute inset-x-0 top-0 flex items-end justify-center px-page">
              <h3 id="orbit-title" className="m-0 text-center font-display text-[clamp(40px,min(11vw,12svh),124px)]/[0.98] font-bold tracking-[-0.015em] text-balance text-scene-ink translate-y-[0.22em]">
                <span className="orbit-title__text inline-block translate-y-[135%]" />
              </h3>
            </div>
          </article>
          <p className="orbit-status sr-only" aria-live="polite" />
          <button type="button" className={sceneButton}>
            Back to the meadow <ScrollArrow up />
          </button>
        </section>
      </main>
    </div>
  )
}
