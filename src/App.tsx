import { useEffect, useRef } from 'react'
import { Director } from './director'
import { glyphs } from './data/glyphs'

const heroLine = 'hero__line relative block w-full'
const skeletonOverlay = 'absolute inset-0 overflow-hidden [--ars-radius:0px] [clip-path:inset(0_100%_0_0)] text-left leading-none font-ascii font-normal [&_:is(.ars,.ars-block)]:size-full'
const heroSkeleton = `hero__skeleton ${skeletonOverlay} tracking-normal [&[hidden]]:hidden`

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

        <section className="space-view pointer-events-none fixed inset-0 z-3 opacity-0 outline-none" tabIndex={-1} aria-labelledby="space-title" inert>
          <h2 id="space-title" className="absolute inset-x-page top-[60svh] m-0 -translate-y-1/2 text-center font-display text-[clamp(32px,min(6.1vw,8svh),88px)]/[1.05] font-bold tracking-[-0.01em] text-balance text-scene-ink">
            Beyond the atmosphere
          </h2>
          <button type="button" className={sceneButton}>
            Back to the meadow <ScrollArrow up />
          </button>
        </section>
      </main>
    </div>
  )
}
