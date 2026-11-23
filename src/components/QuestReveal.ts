import { gsap } from '../lib/ease'
import type { AsciiDither } from './AsciiDither'

const FRAME_IN = 740
const FIRST_SWEEP = 0.16
const STAGGER = 0.34
const SWEEP = 920
const CHECK = 360
const SWEEP_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)'

interface Effect {
  animations: Animation[]
  unmount?: () => void
}

/** One entrance per visit; subsequent returns show the already accepted quest. */
export class QuestReveal {
  private readonly lines: NodeListOf<HTMLElement>
  private readonly details: HTMLAnchorElement
  private readonly panel: HTMLElement
  private readonly choice: HTMLElement
  private readonly check: SVGPathElement
  private readonly effects = new Set<Effect>()
  private timeline: gsap.core.Timeline | null = null
  private played = false

  constructor(private readonly el: HTMLElement, private readonly dither: AsciiDither) {
    this.lines = el.querySelectorAll<HTMLElement>('[data-quest-line]')
    this.details = el.querySelector<HTMLAnchorElement>('.quest__details')!
    this.panel = el.querySelector<HTMLElement>('.quest')!
    this.choice = el.querySelector<HTMLElement>('.quest__choice--accepted')!
    this.check = el.querySelector<SVGPathElement>('.quest__check')!
    document.addEventListener('visibilitychange', this.visibility)
  }

  prepare(): void {
    if (this.played) return
    this.el.dataset.questReveal = 'pending'
    this.details.inert = true
  }

  show(): void {
    if (this.el.dataset.questReveal !== 'pending') return
    this.played = true
    if (document.hidden) return this.finish()

    const ease = getComputedStyle(this.el).getPropertyValue('--ease-scene').trim()
    this.el.dataset.questReveal = 'running'
    this.play([this.panel.animate([
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: FRAME_IN, easing: ease, fill: 'both' })])
    const timeline = gsap.timeline()
    this.timeline = timeline
    this.lines.forEach((line, index) => {
      timeline.call(() => this.sweep(line, index, ease), [], FIRST_SWEEP + index * STAGGER)
    })
  }

  /** Freeze the current crest while the camera fades the panel out. */
  pause(): void {
    this.timeline?.pause()
    for (const effect of this.effects) {
      for (const animation of effect.animations) animation.pause()
    }
  }

  finish(): void {
    if (!this.el.hasAttribute('data-quest-reveal')) return
    this.timeline?.kill()
    this.timeline = null
    for (const effect of this.effects) this.dispose(effect)
    this.effects.clear()
    this.details.inert = false
    delete this.el.dataset.questReveal
    for (const line of this.lines) line.removeAttribute('data-quest-visible')
  }

  destroy(): void {
    this.finish()
    document.removeEventListener('visibilitychange', this.visibility)
  }

  private sweep(line: HTMLElement, index: number, ease: string): void {
    const overlay = line.querySelector<HTMLElement>('.ascii-dither-overlay')!
    const copy = line.querySelector<HTMLElement>('[data-quest-copy]')!
    const unmount = this.dither.mount(line, overlay, 61 + index)
    const maskPosition = ['140% 0px', '0% 0px']
    const timing: KeyframeAnimationOptions = { duration: SWEEP, easing: SWEEP_EASE, fill: 'both' }
    this.play([
      overlay.animate({ maskPosition, opacity: [0, 0.65, 0.48, 0] }, timing),
      copy.animate({ maskPosition, opacity: [0.45, 1, 1] }, timing),
    ], () => {
      line.setAttribute('data-quest-visible', '')
      if (line.contains(this.details)) this.details.inert = false
      if (index === this.lines.length - 1) this.accept(ease)
    }, unmount)
  }

  private accept(ease: string): void {
    this.el.dataset.questReveal = 'accepted'
    const timing: KeyframeAnimationOptions = { duration: CHECK, easing: ease, fill: 'both' }
    this.play([
      this.check.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], timing),
      this.choice.animate([{ scale: 0.97 }, { scale: 1 }], timing),
    ], () => this.finish())
  }

  private play(animations: Animation[], complete?: () => void, unmount?: () => void): void {
    const effect = { animations, unmount }
    this.effects.add(effect)
    void Promise.all(animations.map((animation) => animation.finished)).then(() => {
      if (!this.effects.delete(effect)) return
      complete?.()
      this.dispose(effect)
    }, () => {})
  }

  private dispose(effect: Effect): void {
    for (const animation of effect.animations) animation.cancel()
    effect.unmount?.()
  }

  private visibility = (): void => {
    if (document.hidden && this.played) this.finish()
  }
}
