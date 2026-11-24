import { animateSkeleton, asciiSkeletonHTML, SKELETON_CSS } from 'ascii-reveal/core'

const ROLES = ['Creative Technologist', 'Frontend Specialist', 'Product Engineer'] as const
const HOLD = 3200
const LOADING = 900
const ENTRANCE_STAGGER = 50
// ascii-reveal 0.3.0 caps block textures at 96 glyph columns.
const SKELETON_COLUMNS = 96
// Scroll exit (fraction of the descent): the dither covers each line, then drains row by row.
const EXIT_END = 0.3
const EXIT_STAGGER = 0.15
const EXIT_COVER = 0.5

const clamp = (value: number): number => Math.max(0, Math.min(1, value))

/** Original dither skeletons shimmer briefly before the actual copy replaces them. */
export class AsciiHero {
  private readonly styles = document.createElement('style')
  private readonly roleSizer = document.createElement('span')
  private readonly role: HTMLElement
  private readonly text: HTMLElement
  private readonly metrics: CanvasRenderingContext2D
  private readonly name: HTMLElement
  private readonly nickname: HTMLElement
  private readonly hover = matchMedia('(hover: hover) and (pointer: fine)')
  private readonly nicknameWaves: Animation[] = []
  private stopNicknameShimmer: (() => void) | null = null
  private nicknameHovered = false
  private nicknameFocused = false
  private nicknameOpen = false
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
  private exitProgress = 0
  private readonly exitStops: (() => void)[] = []

  constructor(private readonly el: HTMLElement) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    this.metrics = canvas.getContext('2d')!
    this.styles.textContent = SKELETON_CSS
    el.append(this.styles)
    this.role = el.querySelector<HTMLElement>('.hero__role')!
    this.text = el.querySelector<HTMLElement>('[data-hero-role]')!
    this.name = el.querySelector<HTMLElement>('.hero__name')!
    this.nickname = el.querySelector<HTMLElement>('.hero__nickname-content')!
    this.name.addEventListener('pointerenter', this.nicknameEnter)
    this.name.addEventListener('pointerleave', this.nicknameLeave)
    this.name.addEventListener('focus', this.nicknameFocus)
    this.name.addEventListener('blur', this.nicknameBlur)
    this.hover.addEventListener('change', this.nicknameLeave)
    this.roleSizer.className = 'invisible grid whitespace-nowrap [grid-area:1/1] *:[grid-area:1/1]'
    this.roleSizer.setAttribute('aria-hidden', 'true')
    for (const label of ROLES) {
      const option = document.createElement('span')
      option.textContent = label
      this.roleSizer.append(option)
    }
    this.role.prepend(this.roleSizer)
    this.motion.addEventListener('change', this.motionChange)
    document.addEventListener('visibilitychange', this.visibility)
  }

  async start(): Promise<void> {
    if (this.started || this.destroyed) return
    this.started = true
    const name = this.el.querySelector<HTMLElement>('[data-hero-name]')!
    await Promise.all([
      document.fonts.ready,
      document.fonts.load(getComputedStyle(name).font),
      document.fonts.load(getComputedStyle(this.text).font),
    ])
    if (this.destroyed) return
    this.el.hidden = false
    if (this.exitProgress > 0 || this.motion.matches) this.applyExit()
    else await this.play(true)
  }

  /** Follows the descent: 0 at the sea, 1 once the camera has left the hero behind. */
  setExit(scrollProgress: number): void {
    const progress = clamp(scrollProgress / EXIT_END)
    if (progress === this.exitProgress) return
    this.exitProgress = progress
    this.applyExit()
  }

  private applyExit(): void {
    if (!this.started || this.destroyed || this.el.hidden) return
    const progress = this.exitProgress
    const reduced = this.motion.matches
    this.el.inert = progress >= 1
    this.el.style.opacity = reduced && progress > 0 ? String(1 - progress) : ''
    this.el.style.visibility = !reduced && progress >= 1 ? 'hidden' : ''
    if (reduced || progress === 0 || progress >= 1) {
      this.clearExit()
      if (progress === 0) this.schedule()
      return
    }
    const lines = this.el.querySelectorAll<HTMLElement>('.hero__line')
    if (!this.exitStops.length) {
      this.stop()
      lines.forEach((line, i) => {
        const dispose = this.mountSkeleton(line, 41 + i * 10)
        this.exitStops.push(() => {
          dispose()
          line.querySelector<HTMLElement>('.hero__skeleton')!.style.removeProperty('clip-path')
          line.querySelector<HTMLElement>('.hero__text')!.style.removeProperty('clip-path')
        })
      })
    }
    lines.forEach((line, i) => {
      const overlay = line.querySelector<HTMLElement>('.hero__skeleton')!
      const local = clamp((progress - i * EXIT_STAGGER) / (1 - EXIT_STAGGER))
      const cover = clamp(local / EXIT_COVER)
      const drain = clamp((local - EXIT_COVER) / (1 - EXIT_COVER))
      // Whole glyph rows fall away from the top, like the copy pouring over the brink.
      const rows = Number(overlay.dataset.rows) || 1
      const drained = Math.round(drain * drain * rows) / rows
      overlay.style.clipPath = `inset(${drained * 100}% ${(1 - cover) * 100}% 0 0)`
      line.querySelector<HTMLElement>('.hero__text')!.style.clipPath = `inset(0 0 0 ${cover * 100}%)`
    })
  }

  private clearExit(): void {
    for (const stop of this.exitStops) stop()
    this.exitStops.length = 0
  }

  /** Fills `line` with a shimmering dither block that tracks its size; returns its disposer. */
  private mountSkeleton(line: HTMLElement, seed: number): () => void {
    const overlay = line.querySelector<HTMLElement>('.hero__skeleton')!
    const style = getComputedStyle(overlay)
    const baseFontSize = Number.parseFloat(style.fontSize)
    this.metrics.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const advance = this.metrics.measureText('M').width
    let width = -1
    let height = -1
    let disposed = false
    let stopShimmer: (() => void) | null = null
    const render = () => {
      if (disposed) return
      const bounds = line.getBoundingClientRect()
      if (bounds.width === width && bounds.height === height) return
      width = bounds.width
      height = bounds.height
      stopShimmer?.()
      // Leave one column spare so rounding cannot expose an untextured right edge.
      const fontSize = Math.max(baseFontSize,
        Math.ceil(width * baseFontSize / ((SKELETON_COLUMNS - 1) * advance)))
      const rows = Math.max(1, Math.ceil(height / fontSize))
      overlay.style.fontSize = `${fontSize}px`
      overlay.dataset.rows = String(rows)
      overlay.innerHTML = asciiSkeletonHTML({ variant: 'terminal', rows, seed, css: false })
      stopShimmer = animateSkeleton(overlay.firstElementChild as HTMLElement)
    }
    overlay.hidden = false
    line.classList.add('is-loading')
    render()
    const resize = new ResizeObserver(render)
    resize.observe(line)
    return () => {
      disposed = true
      resize.disconnect()
      stopShimmer?.()
      overlay.replaceChildren()
      overlay.style.removeProperty('font-size')
      delete overlay.dataset.rows
      overlay.hidden = true
      line.classList.remove('is-loading')
    }
  }

  private showSkeleton(line: HTMLElement, seed: number, initial: boolean, delay = 0): void {
    const dispose = this.mountSkeleton(line, seed)
    const overlay = line.querySelector<HTMLElement>('.hero__skeleton')!
    this.waveLines.push(line)
    const text = line.querySelector<HTMLElement>('.hero__text')!
    if (initial) {
      text.style.clipPath = 'inset(0 100% 0 0)'
      const timing: KeyframeAnimationOptions = { duration: LOADING, delay, easing: 'linear', fill: 'both' }
      this.waves.push(
        overlay.animate([
          { clipPath: 'inset(0 100% 0 0)', offset: 0 },
          { clipPath: 'inset(0)', offset: 0.5 },
          { clipPath: 'inset(0 0 0 100%)', offset: 1 },
        ], timing),
        text.animate([
          { clipPath: 'inset(0 100% 0 0)', offset: 0 },
          { clipPath: 'inset(0 100% 0 0)', offset: 0.5 },
          { clipPath: 'inset(0)', offset: 1 },
        ], timing),
      )
    } else {
      this.sweep(overlay, 'inset(0 100% 0 0)', 'inset(0)')
      this.sweep(text, 'inset(0)', 'inset(0 0 0 100%)')
    }
    this.skeletonStops.push(() => {
      dispose()
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

  private waitForSweep(duration = LOADING / 2): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>()
    this.finishLoading = resolve
    this.loadingTimer = window.setTimeout(resolve, duration)
    return promise
  }

  private async play(initial = false): Promise<void> {
    if (this.destroyed || this.motion.matches || document.hidden || this.exitProgress > 0) return
    const epoch = ++this.epoch
    this.busy = true
    try {
      if (initial) {
        const lines = this.el.querySelectorAll<HTMLElement>('.hero__line')
        lines.forEach((line, i) => this.showSkeleton(line, 7 + i * 10, true, i * ENTRANCE_STAGGER))
        await this.waitForSweep(LOADING + (lines.length - 1) * ENTRANCE_STAGGER)
        return
      }
      this.showSkeleton(this.role.querySelector<HTMLElement>('.hero__line')!, 17 + this.index, false)
      await this.waitForSweep()
      if (epoch !== this.epoch || this.destroyed) return
      this.index = (this.index + 1) % ROLES.length
      this.text.textContent = ROLES[this.index]
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
    if (!this.started || this.destroyed || this.busy || this.motion.matches || document.hidden
      || this.exitProgress > 0) return
    this.timer = window.setTimeout(() => {
      this.timer = 0
      void this.play()
    }, HOLD)
  }

  private updateNickname(instant = false): void {
    const open = this.nicknameHovered || this.nicknameFocused
    this.nicknameOpen = open
    this.name.classList.toggle('is-nickname-open', open)
    if (this.motion.matches || document.hidden || this.destroyed) {
      this.clearNickname()
      return
    }
    const overlay = this.nickname.querySelector<HTMLElement>('.hero__nickname-noise')!
    if (!this.nicknameWaves.length) {
      const rows = Math.max(1, Math.ceil(this.nickname.offsetHeight / 10))
      overlay.innerHTML = asciiSkeletonHTML({ variant: 'terminal', rows, seed: 27, css: false })
      const timing: KeyframeAnimationOptions = { duration: 400, easing: 'linear', fill: 'both' }
      this.nicknameWaves.push(
        overlay.animate([
          { clipPath: 'inset(0 100% 0 0)', offset: 0 },
          { clipPath: 'inset(0)', offset: 0.5 },
          { clipPath: 'inset(0 0 0 100%)', offset: 1 },
        ], timing),
        this.nickname.querySelector<HTMLElement>('.hero__nickname-text')!.animate([
          { clipPath: 'inset(0 100% 0 0)', offset: 0 },
          { clipPath: 'inset(0 100% 0 0)', offset: 0.5 },
          { clipPath: 'inset(0)', offset: 1 },
        ], timing),
      )
      for (const wave of this.nicknameWaves) {
        wave.pause()
        wave.currentTime = 0
      }
    }
    if (instant) {
      for (const wave of this.nicknameWaves) {
        wave.pause()
        wave.currentTime = open ? 400 : 0
      }
      this.stopNicknameShimmer?.()
      this.stopNicknameShimmer = null
      return
    }
    this.stopNicknameShimmer ??= animateSkeleton(overlay.firstElementChild as HTMLElement)
    for (const wave of this.nicknameWaves) {
      wave.updatePlaybackRate(open ? 1 : -1)
      wave.play()
    }
    void this.nicknameWaves[0].finished.then(() => {
      if (this.nicknameOpen !== open) return
      this.stopNicknameShimmer?.()
      this.stopNicknameShimmer = null
    }).catch(() => {})
  }

  private clearNickname(): void {
    this.stopNicknameShimmer?.()
    this.stopNicknameShimmer = null
    for (const wave of this.nicknameWaves) wave.cancel()
    this.nicknameWaves.length = 0
    this.nickname.querySelector('.hero__nickname-noise')!.replaceChildren()
  }

  private nicknameEnter = (event: PointerEvent): void => {
    if (!this.hover.matches || event.pointerType === 'touch') return
    this.nicknameHovered = true
    this.updateNickname()
  }

  private nicknameLeave = (): void => {
    this.nicknameHovered = false
    this.updateNickname()
  }

  private nicknameFocus = (): void => {
    this.nicknameFocused = this.name.matches(':focus-visible')
    this.updateNickname()
  }

  private nicknameBlur = (): void => {
    this.nicknameFocused = false
    this.updateNickname()
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

  private motionChange = (): void => {
    this.stop()
    this.clearExit()
    this.clearNickname()
    this.updateNickname(true)
    this.applyExit()
    this.schedule()
  }

  private visibility = (): void => {
    if (document.hidden) {
      this.stop()
      this.nicknameHovered = false
      this.nicknameFocused = false
      this.updateNickname(true)
    } else {
      this.schedule()
    }
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    this.clearExit()
    this.clearNickname()
    this.el.style.removeProperty('opacity')
    this.el.style.removeProperty('visibility')
    this.el.inert = false
    this.name.removeEventListener('pointerenter', this.nicknameEnter)
    this.name.removeEventListener('pointerleave', this.nicknameLeave)
    this.name.removeEventListener('focus', this.nicknameFocus)
    this.name.removeEventListener('blur', this.nicknameBlur)
    this.hover.removeEventListener('change', this.nicknameLeave)
    this.motion.removeEventListener('change', this.motionChange)
    document.removeEventListener('visibilitychange', this.visibility)
    this.styles.remove()
    this.roleSizer.remove()
  }
}
