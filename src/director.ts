import { gsap } from './lib/ease'
import { createTextEffect, effectNames, type TextEffect } from 'tte.js'
import { env, wait } from './lib/env'
import { AsciiRiver } from './components/AsciiRiver'
import { AsciiHero } from './components/AsciiHero'

type Phase = 'boot' | 'animating' | 'reveal' | 'idle'

interface DirectorRefs {
  loader: HTMLElement
  loaderLogo: HTMLElement
  river: HTMLCanvasElement
  hero: HTMLElement
}

/** Runs the ASCII intro and starts the sea and portfolio copy. */
export class Director {
  private refs: DirectorRefs
  private destroyed = false
  private transition: gsap.core.Timeline | null = null
  private intro: TextEffect | null = null
  private river: AsciiRiver
  private hero: AsciiHero

  constructor(refs: DirectorRefs) {
    this.refs = refs
    this.hero = new AsciiHero(refs.hero)
    this.river = new AsciiRiver(refs.river, () => { void this.hero.start() })
  }

  private setPhase(phase: Phase): void {
    document.documentElement.dataset.phase = phase
  }

  async run(): Promise<void> {
    await Promise.race([document.fonts.load('400 16px "Geist Mono"'), wait(900)])
    if (this.destroyed) return
    if (env.skipIntro) return this.showSea()

    if (env.reducedMotion) {
      this.refs.loader.classList.add('is-on')
      await wait(1400)
    } else {
      const effects = effectNames()
      this.intro = createTextEffect(this.refs.loaderLogo, {
        effect: effects[Math.floor(Math.random() * effects.length)],
        // Keep the animation plus the final 250 ms hold within a 3 s cycle.
        duration: 1000 + Math.floor(Math.random() * 1751),
        colors: ['#a3a3a3', '#ffffff'],
        fontScale: 1 / 1.1,
        fps: 60,
        loop: false,
        autoplay: false,
        respectReducedMotion: true,
      })
      this.setPhase('animating')
      this.refs.loader.classList.add('is-on')
      await this.intro.play()
      if (this.destroyed) return
      await wait(250)
    }
    if (this.destroyed) return
    this.reveal()
  }

  private showSea(): void {
    this.refs.loader.hidden = true
    this.river.start(true)
    this.setPhase('idle')
  }

  private reveal(): void {
    if (env.reducedMotion) return this.showSea()
    const { refs } = this
    this.setPhase('reveal')
    this.transition = gsap.timeline({ onComplete: () => this.setPhase('idle') })
      .to(refs.loader, { opacity: 0, duration: 0.32, ease: 'bloom' })
      .add(() => {
        refs.loader.hidden = true
        this.intro?.destroy()
        this.intro = null
        this.river.start()
      })
  }

  destroy(): void {
    this.destroyed = true
    this.transition?.kill()
    this.intro?.destroy()
    this.river.destroy()
    this.hero.destroy()
  }
}
