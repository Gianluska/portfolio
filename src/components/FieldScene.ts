import { DawnLandscape, smooth } from './DawnLandscape'
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
  private dynamicTop = 0
  private skyPainted = false
  private started = false
  private destroyed = false
  private heroStarted = false
  private state: FieldState = 'waiting'
  private clock = 0
  private frameId = 0
  private previousFrame: number | null = null
  private nextPaint = 0

  constructor(private readonly canvas: HTMLCanvasElement, private readonly onHeroReady: () => void) {
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
    this.resume()
  }

  private resize(): void {
    if (!this.started || this.destroyed) return
    const bounds = this.canvas.getBoundingClientRect()
    const w = Math.max(1, bounds.width), h = Math.max(1, bounds.height)
    const scale = CanvasPalette.scale(w, h)
    if (w === this.width && h === this.height && scale === this.scale) return
    this.width = w
    this.height = h
    this.scale = scale
    this.palette.resize(w, h, scale)
    const ctx = this.palette.context
    this.setTransform()
    this.sky.resize(ctx, w, h)
    const top = this.meadow.resize(w, h)
    this.dynamicTop = Math.max(0, Math.floor(top * this.canvas.height / h) - 2)
    this.skyPainted = false
    this.draw()
  }

  private setTransform(): void {
    const ctx = this.palette.context
    ctx.setTransform(ctx.canvas.width / this.width, 0, 0, ctx.canvas.height / this.height, 0, 0)
  }

  private draw(): void {
    const still = this.motion.matches
    const progress = still ? 1 : Math.min(1, this.clock / SUNRISE)
    const rise = smooth(progress)
    const light = smooth((rise - 0.13) / 0.79)
    const ctx = this.palette.context
    // Once the sun stops, leave the already-quantized sky above the moving field untouched.
    const top = this.skyPainted ? this.dynamicTop : 0
    if (top > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, top * this.height / this.canvas.height, this.width, this.height)
      ctx.clip()
    }
    this.sky.draw(ctx, rise, light)
    this.meadow.draw(ctx, still ? SUNRISE : this.clock, light)
    if (top > 0) ctx.restore()
    this.palette.present(top)
    this.skyPainted = progress === 1
    this.setState(still ? 'still' : progress < 1 ? 'sunrise' : 'daylight')
    // Wait for the disc to clear the text before starting the dither reveal.
    if (!this.heroStarted && rise >= 0.91) {
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
