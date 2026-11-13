import { gsap } from './lib/ease'
import { createTextEffect, effectNames, type TextEffect } from 'tte.js'
import { env, wait } from './lib/env'
import { AsciiLogo } from './components/AsciiLogo'
import { AsciiRiver } from './components/AsciiRiver'
import { NavLink } from './components/NavLink'

type Phase = 'boot' | 'animating' | 'reveal' | 'idle'

interface DirectorRefs {
  loader: HTMLElement
  loaderLogo: HTMLElement
  river: HTMLCanvasElement
  ui: HTMLElement
  header: HTMLElement
  headerLink: HTMLElement
  headerLogo: HTMLElement
  links: HTMLElement[]
  navItems: HTMLElement[]
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
  private links: NavLink[]

  constructor(refs: DirectorRefs) {
    this.refs = refs
    this.headerLogo = new AsciiLogo(refs.headerLogo)
    this.river = new AsciiRiver(refs.river)
    this.links = refs.links.map((el) => new NavLink(el))
    refs.headerLink.addEventListener('pointerenter', this.onLogoEnter)
    refs.headerLink.addEventListener('focus', this.onLogoEnter)
  }

  private onLogoEnter = (): void => {
    if (this.phase === 'idle' && !env.reducedMotion) this.headerLogo.wave()
  }

  private setPhase(phase: Phase): void {
    this.phase = phase
    document.documentElement.dataset.phase = phase
  }

  async run(): Promise<void> {
    await Promise.race([document.fonts.load('400 16px "Geist Mono"'), wait(900)])
    if (this.destroyed) return
    if (env.skipIntro) return this.showHeader()

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
    gsap.set(refs.navItems, { opacity: 0, y: -12 })
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
      .to(refs.navItems, { opacity: 1, y: 0, duration: 0.9, ease: 'rise', stagger: 0.09 }, 0.4)
      .add(() => this.links.forEach((link, i) => link.scramble(i * 90)), 0.4)
  }

  destroy(): void {
    this.destroyed = true
    this.transition?.kill()
    this.refs.headerLink.removeEventListener('pointerenter', this.onLogoEnter)
    this.refs.headerLink.removeEventListener('focus', this.onLogoEnter)
    this.intro?.destroy()
    this.river.destroy()
    this.headerLogo.destroy()
    this.links.forEach((link) => link.destroy())
  }
}
