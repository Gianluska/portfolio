import { gsap } from './lib/ease'
import { env, wait } from './lib/env'
import { AsciiLogo } from './components/AsciiLogo'
import { NavLink } from './components/NavLink'

const MIN_LOADER = 2000 // ciclo livre + resolução l→k + pausa = aproximadamente 3 s

type Phase = 'boot' | 'cycling' | 'resolving' | 'reveal' | 'idle'

interface DirectorRefs {
  loader: HTMLElement
  loaderLogo: HTMLElement
  ui: HTMLElement
  header: HTMLElement
  headerLink: HTMLElement
  headerLogo: HTMLElement
  links: HTMLElement[]
  navItems: HTMLElement[]
}

/** Apenas a abertura ASCII e a entrada do cabeçalho, sem cena ou conteúdo de hero. */
export class Director {
  private phase: Phase = 'boot'
  private refs: DirectorRefs
  private destroyed = false
  private transition: gsap.core.Timeline | null = null
  private loaderLogo: AsciiLogo
  private headerLogo: AsciiLogo
  private links: NavLink[]

  constructor(refs: DirectorRefs) {
    this.refs = refs
    this.loaderLogo = new AsciiLogo(refs.loaderLogo)
    this.headerLogo = new AsciiLogo(refs.headerLogo)
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

    this.refs.loader.classList.add('is-on')
    if (env.reducedMotion) {
      await wait(1400)
    } else {
      this.setPhase('cycling')
      this.loaderLogo.startCycling()
      await wait(MIN_LOADER)
      if (this.destroyed) return
      this.setPhase('resolving')
      await this.loaderLogo.resolve()
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
      .add(() => { refs.loader.hidden = true })
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
    this.loaderLogo.destroy()
    this.headerLogo.destroy()
    this.links.forEach((link) => link.destroy())
  }
}
