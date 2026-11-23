import { useEffect, useRef, useState } from 'react'
import { Director } from './director'
import { glyphs } from './data/glyphs'

const heroLine = 'hero__line relative block w-full'
const skeletonOverlay = 'absolute inset-0 overflow-hidden [--ars-radius:0px] [clip-path:inset(0_100%_0_0)] text-left leading-none font-ascii font-normal [&_:is(.ars,.ars-block)]:size-full'
const heroSkeleton = `hero__skeleton ${skeletonOverlay} tracking-normal [&[hidden]]:hidden`

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  const [light, setLight] = useState(() => document.documentElement.dataset.theme === 'light')
  const nextTheme = light ? 'dark' : 'light'

  function toggleTheme() {
    const html = document.documentElement
    html.dataset.theme = nextTheme
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content = getComputedStyle(html).backgroundColor
    setLight(!light)
    try {
      localStorage.setItem('theme', nextTheme)
    } catch {
      // The toggle still works when storage is blocked.
    }
  }

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
          [font-kerning:none] [font-variant-ligatures:none] select-none group-[.is-on]/loader:visible">{glyphs.official.join('\n')}</pre>
      </div>

      <canvas className="river pointer-events-none fixed inset-0 z-0 block size-full data-[state=waiting]:invisible" data-state="waiting" aria-hidden="true" />


      <div className="ui pointer-events-none invisible fixed inset-0 z-3">
        <header className="header absolute inset-x-0 top-0 isolate z-1 flex items-center p-page
          before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-1
          before:h-[calc(100%+clamp(48px,8vh,120px))] before:bg-header-veil before:opacity-0 before:[transform:translateY(-100%)]
          before:[transition:transform_1.2s_var(--ease-scene),opacity_0.9s_var(--ease-scene)]
          [&.is-veiled]:before:opacity-100 [&.is-veiled]:before:[transform:none] motion-reduce:before:[transition-duration:0.01s]">
          <button type="button" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`}
            className="pointer-events-auto ml-auto inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm
              border border-solid border-scene-ink/35 bg-scene px-3 font-mono text-xs tracking-wide text-scene-ink
              hover:bg-scene-ink/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-scene-ink">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {light
                ? <path d="M20.9 13.35A9 9 0 0 1 10.65 3.1 9 9 0 1 0 20.9 13.35Z" />
                : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42m0-14.14-1.42 1.42m-11.3 11.3-1.42 1.42" /></>}
            </svg>
            <span className="capitalize">{nextTheme}</span>
          </button>
        </header>
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
