import { sweepIn, type AsciiDither } from './AsciiDither'

const FADE_IN = 320
const REVEAL_TIME = 660
const CHECK_TIME = 220

/** One entrance per visit; subsequent returns show the already accepted quest. */
export class QuestReveal {
  private readonly lines: NodeListOf<HTMLElement>
  private readonly details: HTMLAnchorElement
  private readonly check: SVGPathElement
  private animations: Animation[] | null = null
  private unmount: (() => void) | null = null
  private played = false

  constructor(private readonly el: HTMLElement, private readonly dither: AsciiDither) {
    this.lines = el.querySelectorAll<HTMLElement>('[data-quest-line]')
    this.details = el.querySelector<HTMLAnchorElement>('.quest__details')!
    this.check = el.querySelector<SVGPathElement>('.quest__check')!
    document.addEventListener('visibilitychange', this.visibility)
  }

  prepare(): void {
    if (this.played) return
    this.el.dataset.questReveal = 'pending'
    this.details.inert = true
  }

  async show(): Promise<void> {
    if (this.el.dataset.questReveal !== 'pending') return
    this.played = true
    if (document.hidden) return this.finish()

    this.el.dataset.questReveal = 'running'
    if (!await this.play([this.el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: FADE_IN, easing: getComputedStyle(this.el).getPropertyValue('--ease-scene'),
    })])) return

    for (const [index, line] of this.lines.entries()) {
      const overlay = line.querySelector<HTMLElement>('.ascii-dither-overlay')!
      const copy = line.querySelector<HTMLElement>('[data-quest-copy]')!
      this.unmount = this.dither.mount(line, overlay, 61 + index)
      if (!await this.play(sweepIn(overlay, copy, REVEAL_TIME))) return
      line.setAttribute('data-quest-visible', '')
      this.unmount()
      this.unmount = null
      if (copy.contains(this.details)) this.details.inert = false
    }

    const draw = this.check.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: CHECK_TIME, easing: 'linear',
    })
    this.el.dataset.questReveal = 'accepted'
    if (await this.play([draw])) this.finish()
  }

  finish(): void {
    if (!this.el.hasAttribute('data-quest-reveal')) return
    const animations = this.animations
    this.animations = null
    for (const animation of animations ?? []) animation.cancel()
    this.unmount?.()
    this.unmount = null
    this.details.inert = false
    delete this.el.dataset.questReveal
    for (const line of this.lines) line.removeAttribute('data-quest-visible')
  }

  destroy(): void {
    this.finish()
    document.removeEventListener('visibilitychange', this.visibility)
  }

  private async play(animations: Animation[]): Promise<boolean> {
    this.animations = animations
    try {
      await Promise.all(animations.map((animation) => animation.finished))
    } catch (error) {
      if (this.animations !== animations) return false
      throw error
    }
    if (this.animations !== animations) return false
    this.animations = null
    for (const animation of animations) animation.cancel()
    return true
  }

  private visibility = (): void => {
    if (document.hidden && this.played) this.finish()
  }
}
