import { DawnLandscape } from './DawnLandscape'
import { CanvasPalette } from './CanvasPalette'
import { WindMeadow } from './WindMeadow'

const SUNRISE = 3.8
const FRAME_TIME = 1000 / 60

type FieldState = 'waiting' | 'sunrise' | 'daylight' | 'still'

/** One clock for the sunrise, wind and the handoff from the loader to the hero. */
export class FieldScene {
  private readonly palette: CanvasPalette
  private readonly sky = new DawnLandscape()
  private readonly meadow = new WindMeadow()
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer = new ResizeObserver(() => this.resize())
  private width = 0
  private height = 0
  private scale = 0
  private groundLimit = 0
  private groundLeft = 0
  private groundRight = 0
  private dynamicBottom = 0
  private sceneryPainted = false
  private started = false
  private destroyed = false
  private heroStarted = false
  private state: FieldState = 'waiting'
  private clock = 0
  private frameId = 0
  private previousFrame: number | null = null
  private nextPaint = 0

  constructor(private readonly canvas: HTMLCanvasElement, private readonly hero: Element, private readonly onHeroReady: () => void) {
    this.palette = new CanvasPalette(canvas)
    this.motion.addEventListener('change', this.motionChange)
    document.addEventListener('visibilitychange', this.visibilityChange)
  }

  start(immediate = false): void {
    if (this.started || this.destroyed) return
    this.started = true
    if (immediate || this.motion.matches) this.clock = SUNRISE
    this.resize()
    this.observer.observe(this.canvas)
    this.observer.observe(this.hero)
    this.resume()
  }

  private resize(): void {
    if (!this.started || this.destroyed) return
    const bounds = this.canvas.getBoundingClientRect()
    const w = Math.max(1, bounds.width), h = Math.max(1, bounds.height)
    const scale = CanvasPalette.scale(w, h)
    const copy = this.hero.getBoundingClientRect()
    const groundLimit = Math.floor(copy.top - bounds.top - Math.min(10, h * 0.012))
    const groundLeft = Math.floor(copy.left - bounds.left)
    const groundRight = Math.ceil(copy.right - bounds.left)
    const viewportChanged = w !== this.width || h !== this.height || scale !== this.scale
    if (!viewportChanged && groundLimit === this.groundLimit && groundLeft === this.groundLeft && groundRight === this.groundRight) return
    if (viewportChanged) {
      this.width = w
      this.height = h
      this.scale = scale
      this.palette.resize(w, h, scale)
      this.setTransform()
      this.sky.resize(w, h)
      this.dynamicBottom = this.meadow.resize(w, h, this.canvas.width, this.canvas.height)
      this.sceneryPainted = false
    }
    this.groundLimit = groundLimit
    this.groundLeft = groundLeft
    this.groundRight = groundRight
    this.meadow.setLightBoundary(groundLimit, groundLeft, groundRight)
    this.draw()
  }

  private setTransform(): void {
    const ctx = this.palette.context
    ctx.setTransform(ctx.canvas.width / this.width, 0, 0, ctx.canvas.height / this.height, 0, 0)
  }

  private draw(): void {
    const still = this.motion.matches
    const progress = still ? 1 : Math.min(1, this.clock / SUNRISE)
    // Asymmetric ease: peak speed in the first third, then a long, gentle approach to rest.
    const remaining = 1 - progress
    const rise = 1 - remaining * remaining * remaining * (1 + 3 * progress)
    const ctx = this.palette.context
    // Keep the still foreground out of the raster pass once the sky and horizon are lit.
    const bottom = this.sceneryPainted ? this.dynamicBottom : this.canvas.height
    if (this.sceneryPainted) {
      ctx.save()
      ctx.beginPath()
      const cssScale = this.height / this.canvas.height
      ctx.rect(0, 0, this.width, bottom * cssScale)
      ctx.clip()
    }
    const elevation = this.sky.draw(ctx, rise, still ? 0 : this.clock)
    this.meadow.draw(ctx, still ? SUNRISE : this.clock, elevation)
    if (this.sceneryPainted) ctx.restore()
    this.palette.present(bottom)
    this.sceneryPainted = progress === 1
    this.setState(still ? 'still' : progress < 1 ? 'sunrise' : 'daylight')
    // Reveal the title once the light has reached the foreground.
    if (!this.heroStarted && progress >= 0.8) {
      this.heroStarted = true
      this.onHeroReady()
    }
  }

  private setState(state: FieldState): void {
    if (this.state === state) return
    this.state = state
    this.canvas.dataset.state = state
  }

  private frame = (now: number): void => {
    this.frameId = 0
    if (this.destroyed || document.hidden || this.motion.matches) return
    if (this.previousFrame !== null) this.clock += (now - this.previousFrame) / 1000
    this.previousFrame = now
    if (now >= this.nextPaint - 0.5) {
      this.nextPaint = this.nextPaint === 0 ? now + FRAME_TIME
        : this.nextPaint + (1 + Math.floor((now - this.nextPaint + 0.5) / FRAME_TIME)) * FRAME_TIME
      this.draw()
    }
    this.resume()
  }

  private resume(): void {
    if (!this.frameId && this.started && !this.destroyed && !document.hidden && !this.motion.matches) {
      this.frameId = requestAnimationFrame(this.frame)
    }
  }

  private stop(): void {
    cancelAnimationFrame(this.frameId)
    this.frameId = 0
    this.previousFrame = null
    this.nextPaint = 0
  }

  private visibilityChange = (): void => {
    if (document.hidden) this.stop()
    else if (this.started && this.motion.matches) this.draw()
    else this.resume()
  }

  private motionChange = (): void => {
    if (!this.started) return
    this.stop()
    this.clock = Math.max(SUNRISE, this.clock)
    this.draw()
    this.resume()
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    this.observer.disconnect()
    this.motion.removeEventListener('change', this.motionChange)
    document.removeEventListener('visibilitychange', this.visibilityChange)
    this.setState('waiting')
  }
}
