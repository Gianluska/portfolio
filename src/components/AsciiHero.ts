import { animateSkeleton, asciiSkeletonHTML, SKELETON_CSS } from 'ascii-reveal/core'

const ROLES = ['Creative Technologist', 'Frontend Specialist', 'Product Engineer'] as const
const HOLD = 3200
const LOADING = 900

/** Original dither skeletons shimmer briefly before the actual copy replaces them. */
export class AsciiHero {
  private readonly styles = document.createElement('style')
  private readonly role: HTMLButtonElement
  private readonly text: HTMLElement
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly skeletonStops: (() => void)[] = []
  private readonly waveLines: HTMLElement[] = []
  private readonly waves: Animation[] = []
  private loadingTimer = 0
  private finishLoading: (() => void) | null = null
  private timer = 0
  private index = 0
  private epoch = 0
  private started = false
  private destroyed = false
  private busy = false
  private paused = false

  constructor(private readonly el: HTMLElement) {
    this.styles.textContent = SKELETON_CSS
    el.append(this.styles)
    this.role = el.querySelector<HTMLButtonElement>('.hero__role')!
    this.text = el.querySelector<HTMLElement>('[data-hero-role]')!
    this.role.addEventListener('click', this.toggle)
    this.motion.addEventListener('change', this.motionChange)
    document.addEventListener('visibilitychange', this.visibility)
    this.updateControl()
  }

  async start(): Promise<void> {
    if (this.started || this.destroyed) return
    this.started = true
    await document.fonts.ready
    if (this.destroyed) return
    this.el.hidden = false
    if (!this.motion.matches) await this.play(true)
  }

  private showSkeleton(line: HTMLElement, seed: number, initial: boolean): void {
    const overlay = line.querySelector<HTMLElement>('.hero__skeleton')!
    const fontSize = Number.parseFloat(getComputedStyle(overlay).fontSize)
    const rows = Math.max(1, Math.ceil(line.getBoundingClientRect().height / fontSize))
    overlay.innerHTML = asciiSkeletonHTML({ variant: 'dither', rows, seed, css: false })
    overlay.hidden = false
    line.classList.add('is-loading')
    this.waveLines.push(line)
    this.sweep(overlay, 'inset(0 100% 0 0)', 'inset(0)')
    const text = line.querySelector<HTMLElement>('.hero__text')!
    if (initial) text.style.clipPath = 'inset(0 100% 0 0)'
    else this.sweep(text, 'inset(0)', 'inset(0 0 0 100%)')
    const stop = animateSkeleton(overlay.firstElementChild as HTMLElement)
    this.skeletonStops.push(() => {
      stop()
      overlay.replaceChildren()
      overlay.hidden = true
      line.classList.remove('is-loading')
      text.style.removeProperty('clip-path')
    })
  }

  private clearSkeletons(): void {
    for (const wave of this.waves) wave.cancel()
    this.waves.length = 0
    this.waveLines.length = 0
    for (const stop of this.skeletonStops) stop()
    this.skeletonStops.length = 0
  }

  private sweep(target: HTMLElement, from: string, to: string): void {
    this.waves.push(target.animate(
      [{ clipPath: from }, { clipPath: to }],
      { duration: LOADING / 2, easing: 'linear', fill: 'both' },
    ))
  }

  private waitForSweep(): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>()
    this.finishLoading = resolve
    this.loadingTimer = window.setTimeout(resolve, LOADING / 2)
    return promise
  }

  private async play(initial = false): Promise<void> {
    if (this.destroyed || this.paused || this.motion.matches || document.hidden) return
    const epoch = ++this.epoch
    this.busy = true
    if (initial) this.showSkeleton(this.el.querySelector<HTMLElement>('.hero__name .hero__line')!, 7, true)
    this.showSkeleton(this.role.querySelector<HTMLElement>('.hero__line')!, 17 + this.index, initial)
    try {
      await this.waitForSweep()
      if (epoch !== this.epoch || this.destroyed) return
      if (!initial) {
        this.index = (this.index + 1) % ROLES.length
        this.text.textContent = ROLES[this.index]
      }
      for (const line of this.waveLines) {
        this.sweep(line.querySelector<HTMLElement>('.hero__skeleton')!, 'inset(0)', 'inset(0 0 0 100%)')
        this.sweep(line.querySelector<HTMLElement>('.hero__text')!, 'inset(0 100% 0 0)', 'inset(0)')
      }
      await this.waitForSweep()
    } finally {
      if (epoch === this.epoch) {
        this.loadingTimer = 0
        this.finishLoading = null
        this.clearSkeletons()
        this.busy = false
        this.schedule()
      }
    }
  }

  private schedule(): void {
    window.clearTimeout(this.timer)
    this.timer = 0
    if (!this.started || this.destroyed || this.busy || this.paused || this.motion.matches || document.hidden) return
    this.timer = window.setTimeout(() => {
      this.timer = 0
      void this.play()
    }, HOLD)
  }

  private stop(): void {
    this.epoch++
    window.clearTimeout(this.timer)
    this.timer = 0
    window.clearTimeout(this.loadingTimer)
    this.loadingTimer = 0
    this.finishLoading?.()
    this.finishLoading = null
    this.clearSkeletons()
    this.busy = false
    this.text.textContent = ROLES[this.index]
  }

  private updateControl(): void {
    this.role.disabled = this.motion.matches
    this.role.setAttribute('aria-pressed', String(this.paused))
    const label = this.paused ? 'Resume role animation' : 'Pause role animation'
    this.role.setAttribute('aria-label', label)
    this.role.title = this.motion.matches ? 'Role animation disabled with reduced motion' : label
  }

  private toggle = (): void => {
    this.paused = !this.paused
    if (this.paused) this.stop()
    else this.schedule()
    this.updateControl()
  }

  private motionChange = (): void => {
    this.stop()
    this.updateControl()
    this.schedule()
  }

  private visibility = (): void => {
    if (document.hidden) this.stop()
    else this.schedule()
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    this.role.removeEventListener('click', this.toggle)
    this.motion.removeEventListener('change', this.motionChange)
    document.removeEventListener('visibilitychange', this.visibility)
    this.styles.remove()
  }
}
