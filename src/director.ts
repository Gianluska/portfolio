import { gsap } from './lib/ease'
import { env, wait } from './lib/env'
import { AsciiLogo } from './components/AsciiLogo'
import { NavLink } from './components/NavLink'
import { RoleCycler } from './components/RoleCycler'
import { DebugPanel } from './components/DebugPanel'
import type { Stage } from './scene/store'

const MIN_LOADER = 2000 // ms de ciclo livre; com a resolução l→k e a pausa, a animação da logo fecha em ~3s
const LOAD_TIMEOUT = 10000 // ms: depois disso, segue sem WebGL
const ROLE_EVERY = 4.8 // tempo para ler cada especialidade
const REVEAL_AFTER_CLOSE = 0
const LOGO_SHRINK = 0.26 // quanto a logo encolhe enquanto o baralho fecha
const LOGO_FADE = 0.65 // quanto a logo esmaece enquanto o baralho fecha

export type Phase = 'boot' | 'cycling' | 'resolving' | 'closing' | 'reveal' | 'idle'

export interface DirectorRefs {
  loader: HTMLElement
  loaderLogo: HTMLElement
  /** Contêiner do canvas WebGL. */
  canvas: HTMLElement
  ui: HTMLElement
  header: HTMLElement
  headerLink: HTMLElement
  headerLogo: HTMLElement
  links: HTMLElement[]
  navItems: HTMLElement[]
  names: HTMLElement[]
  role: HTMLElement
  details: HTMLElement
}

declare global {
  interface Window {
    __lvsk?: Director
  }
}

/**
 * Máquina de fases e timeline mestre:
 * boot → cycling → resolving → closing → reveal → idle
 */
export class Director {
  phase: Phase = 'boot'
  /** Congela o fechamento neste instante (debug). */
  scrub: number | null = env.freezeAt
  stage: Stage | null = null
  private refs: DirectorRefs
  private sceneReady: Promise<Stage | null>
  private destroyed = false
  private revealed = false
  private tweens: gsap.core.Timeline[] = []
  private roleCall: gsap.core.Tween | null = null
  private loaderLogo: AsciiLogo
  private headerLogo: AsciiLogo
  private links: NavLink[]
  private role: RoleCycler
  private debug: DebugPanel | null = null

  constructor(refs: DirectorRefs, roles: string[], sceneReady: Promise<Stage | null>) {
    this.refs = refs
    this.sceneReady = sceneReady
    this.loaderLogo = new AsciiLogo(refs.loaderLogo)
    this.headerLogo = new AsciiLogo(refs.headerLogo)
    this.links = refs.links.map((el) => new NavLink(el))
    this.role = new RoleCycler(refs.role, roles, env.reducedMotion)
    refs.headerLink.addEventListener('pointerenter', this.onLogoEnter)
    refs.headerLink.addEventListener('focus', this.onLogoEnter)
    if (env.debug) {
      this.debug = new DebugPanel(this)
      window.__lvsk = this
    }
  }

  private onLogoEnter = (): void => {
    if (this.phase === 'idle' && !env.reducedMotion) this.headerLogo.wave()
  }

  private setPhase(phase: Phase): void {
    this.phase = phase
    document.documentElement.dataset.phase = phase
  }

  async run(): Promise<void> {
    const { refs } = this

    // a logo só aparece com a fonte mono pronta, para não saltar de métrica
    await Promise.race([document.fonts.load('400 16px "Geist Mono"'), wait(900)])
    if (this.destroyed) return
    refs.loader.classList.add('is-on')

    const quick = env.skipIntro || this.scrub != null
    const animated = !env.reducedMotion && !quick
    if (animated) {
      this.setPhase('cycling')
      this.loaderLogo.startCycling()
    }
    const minimum = quick ? 0 : env.reducedMotion ? 1400 : MIN_LOADER
    const [stage] = await Promise.all([this.load(), wait(minimum)])
    if (this.destroyed) return
    this.stage = stage

    if (!stage) {
      if (animated) await this.resolveLogo()
      return this.fallback()
    }
    if (env.skipIntro) return this.jumpToEnd(stage)
    if (env.reducedMotion) return this.calm(stage)
    if (animated) await this.resolveLogo()
    if (this.destroyed) return
    this.close(stage)
  }

  /** Espera a cena R3F compilar e aquecer a GPU durante o loader. */
  private async load(): Promise<Stage | null> {
    if (env.noWebGL) return null
    const timeout = wait(LOAD_TIMEOUT).then(() => {
      console.warn('[lvsk] a cena não ficou pronta a tempo; seguindo sem WebGL.')
      return null
    })
    return Promise.race([this.sceneReady, timeout])
  }


  private async resolveLogo(): Promise<void> {
    this.setPhase('resolving')
    await this.loaderLogo.resolve()
    await wait(250)
  }

  /** O baralho fecha das bordas ao centro; a logo fica no centro e só esmaece e encolhe de leve. */
  private close(stage: Stage): void {
    const { refs } = this
    const { deck } = stage
    this.setPhase('closing')

    const logo = refs.loaderLogo
    let closeStart: number | null = null

    stage.onFrame = (_dt, time) => {
      if (closeStart == null) closeStart = time
      const T = this.scrub ?? time - closeStart
      stage.closeT = T
      if (!this.revealed && this.scrub == null && T >= deck.tClosed + REVEAL_AFTER_CLOSE) this.reveal(stage)
    }

    stage.onRendered = () => {
      this.debug?.frame(stage)
      if (this.phase !== 'closing' && this.scrub == null) return
      // ease-out cúbico sobre o fechamento inteiro: a logo nunca sai do centro nem gira
      const p = Math.min(1, Math.max(0, stage.closeT / deck.tClosed))
      const e = 1 - Math.pow(1 - p, 3)
      logo.style.transform = `scale(${(1 - LOGO_SHRINK * e).toFixed(4)})`
      logo.style.opacity = (1 - LOGO_FADE * e).toFixed(3)
      refs.loader.style.visibility = deck.aperture.closed && this.scrub == null ? 'hidden' : ''
    }
  }

  /** O baralho abre espaço visual para o nome; a informação conduz a entrada. */
  private reveal(stage: Stage): void {
    const { refs } = this
    const { deck } = stage
    this.revealed = true
    this.setPhase('reveal')
    refs.loader.style.visibility = 'hidden'

    this.prepareUi()

    const tl = gsap.timeline({ onComplete: () => this.idle() })
    this.tweens.push(tl)
    tl.to(stage, { parallax: 1, duration: 1.8, ease: 'bloom' }, 0).to(deck, { idle: 1, duration: 1.8, ease: 'bloom' }, 0)
    this.revealUi(tl, 0.1)
  }

  private prepareUi(): void {
    const { refs } = this
    gsap.set(refs.names, { yPercent: 105 })
    gsap.set(refs.navItems, { opacity: 0, y: -12 })
    gsap.set(refs.headerLogo, { clipPath: 'inset(0% 0% 100% 0%)' })
    gsap.set(refs.details, { opacity: 0, y: 10 })
    refs.ui.style.visibility = 'visible'
  }

  private revealUi(tl: gsap.core.Timeline, at: number): void {
    const { refs } = this
    // o véu escuro do header desce do topo, logo antes da logo e dos links
    tl.add(() => refs.header.classList.add('is-veiled'), at - 0.1)
      .to(refs.names, { yPercent: 0, duration: 1.05, ease: 'rise', stagger: 0.09 }, at)
      .add(() => this.role.show(0), at + 0.25)
      // a logo do header é impressa linha a linha
      .to(refs.headerLogo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.44, ease: 'steps(4)' }, at + 0.25)
      .to(refs.navItems, { opacity: 1, y: 0, duration: 0.9, ease: 'rise', stagger: 0.09 }, at + 0.32)
      .add(() => this.links.forEach((link, i) => link.scramble(i * 90)), at + 0.32)
      .to(refs.details, { opacity: 1, y: 0, duration: 0.8, ease: 'rise' }, at + 0.4)
  }

  private idle(): void {
    this.setPhase('idle')
    if (this.stage) this.stage.interactive = true
    if (!env.reducedMotion) {
      const loop = () => {
        this.role.next()
        this.roleCall = gsap.delayedCall(ROLE_EVERY, loop)
      }
      this.roleCall = gsap.delayedCall(ROLE_EVERY, loop)
    }
  }


  /** Sem animação de entrada: estado final da cena e crossfade. */
  private settle(stage: Stage, { fade }: { fade: boolean }): void {
    const { refs } = this
    const { deck } = stage
    stage.onFrame = () => (stage.closeT = deck.tSettled + 1)
    stage.onRendered = () => this.debug?.frame(stage)
    stage.closeT = deck.tSettled + 1
    stage.parallax = env.reducedMotion ? 0 : 1
    deck.idle = env.reducedMotion ? 0 : 1
    this.revealed = true
    refs.ui.style.visibility = 'visible'
    refs.header.classList.add('is-veiled')
    this.role.show(0)
    if (!fade) {
      refs.loader.style.visibility = 'hidden'
      return this.idle()
    }
    gsap.set(refs.canvas, { opacity: 0 })
    gsap.set(refs.ui, { opacity: 0 })
    const tl = gsap.timeline({ onComplete: () => this.idle() })
    this.tweens.push(tl)
    tl.to(refs.loader, { opacity: 0, duration: 0.7, ease: 'bloom' }, 0)
      .to(refs.canvas, { opacity: 1, duration: 1.2, ease: 'bloom' }, 0.2)
      .to(refs.ui, { opacity: 1, duration: 1.2, ease: 'bloom' }, 0.5)
      .set(refs.loader, { visibility: 'hidden' })
  }

  private calm(stage: Stage): void {
    this.loaderLogo.setOfficial()
    this.settle(stage, { fade: true })
  }

  private jumpToEnd(stage: Stage): void {
    this.loaderLogo.setOfficial()
    this.settle(stage, { fade: false })
  }

  /** Sem WebGL: a logo recua sozinha e a página entra só com DOM. */
  private fallback(): void {
    const { refs } = this
    document.documentElement.classList.add('no-webgl')
    this.setPhase('reveal')
    const tl = gsap.timeline({ onComplete: () => this.idle() })
    this.tweens.push(tl)
    tl.to(refs.loaderLogo, {
      scale: 0.35,
      opacity: 0,
      filter: 'blur(3px)',
      duration: env.reducedMotion ? 0.6 : 1.4,
      ease: 'bloom',
    })
      .set(refs.loader, { visibility: 'hidden' })
      .add(() => this.prepareUi())
    if (env.reducedMotion) {
      tl.add(() => {
        gsap.set([...refs.names, ...refs.navItems, refs.details], { clearProps: 'all' })
        gsap.set(refs.headerLogo, { clipPath: 'none' })
        refs.header.classList.add('is-veiled')
        this.role.show(0)
      })
    } else {
      this.revealUi(tl, tl.duration())
    }
  }

  destroy(): void {
    this.destroyed = true
    this.tweens.forEach((t) => t.kill())
    this.roleCall?.kill()
    if (this.stage) {
      this.stage.onFrame = undefined
      this.stage.onRendered = undefined
    }
    this.refs.headerLink.removeEventListener('pointerenter', this.onLogoEnter)
    this.refs.headerLink.removeEventListener('focus', this.onLogoEnter)
    this.loaderLogo.destroy()
    this.headerLogo.destroy()
    this.links.forEach((l) => l.destroy())
    this.role.destroy()
    this.debug?.destroy()
    if (window.__lvsk === this) delete window.__lvsk
  }
}
