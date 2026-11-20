import { gsap } from './lib/ease'
import { createTextEffect, effectNames, type TextEffect } from 'tte.js'
import { env, wait } from './lib/env'
import { AsciiLogo } from './components/AsciiLogo'
import { AsciiRiver } from './components/AsciiRiver'
import { AsciiHero } from './components/AsciiHero'
import { SceneNavigation } from './components/SceneNavigation'

type Phase = 'boot' | 'animating' | 'reveal' | 'idle'

interface DirectorRefs {
  root: HTMLElement
  loader: HTMLElement
  loaderLogo: HTMLElement
  river: HTMLCanvasElement
  portfolio: HTMLElement
  hero: HTMLElement
  projects: HTMLElement
  ui: HTMLElement
  header: HTMLElement
  home: HTMLElement
  headerLogo: HTMLElement
}

/** Abertura ASCII, entrada do cabeçalho e impacto que revela o rio. */
export class Director {
  private phase: Phase = 'boot'
  private refs: DirectorRefs
  private destroyed = false
  private transition: gsap.core.Timeline | null = null
  private intro: TextEffect | null = null
  private headerLogo: AsciiLogo
  private river: AsciiRiver
  private hero: AsciiHero
  private navigation: SceneNavigation

  constructor(refs: DirectorRefs) {
    this.refs = refs
    this.headerLogo = new AsciiLogo(refs.headerLogo)
    this.hero = new AsciiHero(refs.hero)
    this.river = new AsciiRiver(refs.river, () => { void this.hero.start() }, refs.hero, refs.projects)
    this.navigation = new SceneNavigation(refs, (covered) => this.river.setCovered(covered))
    refs.home.addEventListener('pointerenter', this.onLogoEnter)
    refs.home.addEventListener('focus', this.onLogoEnter)
  }

  private onLogoEnter = (): void => {
    if (this.phase === 'idle' && !env.reducedMotion) this.headerLogo.wave()
  }


  private setPhase(phase: Phase): void {
    this.phase = phase
    document.documentElement.dataset.phase = phase
    if (phase === 'idle') this.navigation.start()
  }

  async run(): Promise<void> {
    await Promise.race([document.fonts.load('400 16px "Geist Mono"'), wait(900)])
    if (this.destroyed) return
    if (env.skipIntro || window.scrollY > 0) return this.showHeader()

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

  private showHeader(): void {
    this.refs.loader.hidden = true
    this.refs.ui.style.visibility = 'visible'
    this.refs.header.classList.add('is-veiled')
    this.river.start(true)
    this.setPhase('idle')
  }

  private reveal(): void {
    if (env.reducedMotion) return this.showHeader()
    const { refs } = this
    this.setPhase('reveal')
    gsap.set(refs.headerLogo, { clipPath: 'inset(0% 0% 100% 0%)' })
    this.transition = gsap.timeline({ onComplete: () => this.setPhase('idle') })
      .to(refs.loader, { opacity: 0, duration: 0.32, ease: 'bloom' })
      .add(() => {
        refs.loader.hidden = true
        this.intro?.destroy()
        this.intro = null
        this.river.start()
      })
      .add(() => {
        refs.ui.style.visibility = 'visible'
        refs.header.classList.add('is-veiled')
      })
      .to(refs.headerLogo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.44, ease: 'steps(4)' }, 0.32)
  }

  destroy(): void {
    this.destroyed = true
    this.transition?.kill()
    this.navigation.destroy()
    this.refs.home.removeEventListener('pointerenter', this.onLogoEnter)
    this.refs.home.removeEventListener('focus', this.onLogoEnter)
    this.intro?.destroy()
    this.river.destroy()
    this.hero.destroy()
    this.headerLogo.destroy()
  }
}
