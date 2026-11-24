import { useEffect, useRef } from 'react'
import { Director } from './director'
import { glyphs } from './data/glyphs'

const heroLine = 'hero__line relative block w-full'
const skeletonOverlay = 'absolute inset-0 overflow-hidden [--ars-radius:0px] [clip-path:inset(0_100%_0_0)] text-left leading-none font-ascii font-normal [&_:is(.ars,.ars-block)]:size-full'
const heroSkeleton = `hero__skeleton ${skeletonOverlay} tracking-normal [&[hidden]]:hidden`
// Preserve the original silhouette; spaces are uninked cells.
const binaryLogo = glyphs.official.map((line, row) =>
  line.replace(/\S/g, (char, col) => (char.charCodeAt(0) + row + col) % 2 ? '1' : '0')).join('\n')

export default function App() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current!
    const $ = (s: string) => el.querySelector<HTMLElement>(s)!
    const director = new Director(
      {
        root: el,
        loader: $('.loader'),
        loaderLogo: $('.loader__logo'),
        river: el.querySelector<HTMLCanvasElement>('.river')!,
        landing: $('.landing'),
        hero: $('.hero'),
        ui: $('.ui'),
        header: $('.header'),
        cue: $('.cue'),
      },
    )
    director.run()
    return () => director.destroy()
  }, [])

  return (
    <div ref={root} className="app motion-safe:[--spring:var(--ease-reveal)]">

      <div className="loader group/loader fixed inset-0 z-1 grid place-items-center bg-scene [&[hidden]]:hidden
        after:pointer-events-none after:fixed after:-inset-1/2 after:z-10
        after:bg-loader-grain after:opacity-[0.075] motion-safe:after:animate-grain" aria-hidden="true">
        <pre className="loader__logo invisible m-0 font-mono text-[clamp(9px,1.5vw,24px)]/[1.1] font-normal whitespace-pre text-scene-ink
          [font-kerning:none] [font-variant-ligatures:none] select-none group-[.is-on]/loader:visible">{binaryLogo}</pre>
      </div>

      <canvas className="river pointer-events-none fixed inset-0 z-0 block size-full data-[state=waiting]:invisible" data-state="waiting" aria-hidden="true" />


      <div className="ui pointer-events-none invisible fixed inset-0 z-3">
        <header className="header absolute inset-x-0 top-0 isolate z-1 p-page
          before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-1
          before:h-[calc(100%+clamp(48px,8vh,120px))] before:bg-header-veil before:opacity-0 before:[transform:translateY(-100%)]
          before:[transition:transform_1.2s_var(--ease-scene),opacity_0.9s_var(--ease-scene)]
          [&.is-veiled]:before:opacity-100 [&.is-veiled]:before:[transform:none] motion-reduce:before:[transition-duration:0.01s]" />
        <div className="cue group/cue pointer-events-none absolute bottom-[max(clamp(16px,3.5svh,32px),env(safe-area-inset-bottom))] left-1/2
          isolate grid justify-items-center gap-1.5 opacity-0 [--p:0] [translate:-50%_14px]
          [transition:opacity_500ms_var(--ease-scene),translate_900ms_var(--ease-scene)]
          before:absolute before:inset-[-36px_-64px_-20px] before:-z-1 before:bg-cue-veil
          data-on:opacity-100 data-on:[translate:-50%_0] data-on:[transition-duration:900ms,1200ms]
          data-spill:[transition:opacity_420ms_var(--ease-scene)_560ms] motion-reduce:hidden" aria-hidden="true" />
      </div>

      <main className="pt-[220svh] motion-reduce:pt-[100svh]">

        <section className="hero pointer-events-none fixed inset-x-page top-[clamp(56px,12svh,144px)] z-3 grid justify-items-center text-center [&[hidden]]:hidden" hidden>
          <div className="pointer-events-auto relative w-fit max-w-full [--ascii-font:var(--font-ascii)] [--ascii-skeleton:currentColor] [font-synthesis:none]">
            <h1 className="hero__name group/nickname m-0 font-display text-[clamp(40px,6.8vw,96px)]/[1.05] font-bold tracking-[-0.01em]
              whitespace-normal text-scene-ink focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-scene-ink" tabIndex={0} aria-label={'Gianlucca "lvsk" Claudino'}>
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
              <span className="hero__role inline-grid min-h-11 place-items-center py-1.5 text-center font-display text-[clamp(24px,2.2vw,32px)]/[1.35] text-scene-muted">
                <span className={`${heroLine} [grid-area:1/1]`}>
                  <span className="hero__text block" data-hero-role aria-hidden="true">Creative Technologist</span>
                  <span className={`${heroSkeleton} text-[10px]`} aria-hidden="true" hidden />
                </span>
              </span>
            </p>
          </div>
        </section>

        <div className="landing relative z-2 min-h-dvh bg-scene motion-safe:scene-veiled:invisible" aria-hidden="true" />
      </main>
    </div>
  )
}
