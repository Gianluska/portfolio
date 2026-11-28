import { DawnLandscape } from './DawnLandscape'
import { CanvasPalette } from './CanvasPalette'
import { WindMeadow } from './WindMeadow'
import { cameraTravel, HORIZON, PARALLAX_GAIN, smooth } from './SceneGeometry'
import { flightEase } from '../lib/ease'

const SUNRISE = 3.8
const FRAME_TIME = 1000 / 60
const ORBIT_FRAME_TIME = 1000 / 30
const CURSOR_CENTER_GAIN = 0.5 / PARALLAX_GAIN
const ASCENT_SECONDS = 3.5
const DESCENT_SECONDS = 2.4
const GROUND_TRAVEL = 2.65
const LAUNCH_SECONDS = 1.8
const LAUNCH_RECOVERY_SECONDS = 0.58

type FieldState = 'waiting' | 'sunrise' | 'daylight' | 'still' | 'launch' | 'flight' | 'space'

/** One clock for the sunrise, wind and the flight between the two views. */
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
  private camera = 0
  private pointerSteer = 0
  private earthSteer = 0
  private destination = 0
  private altitude = 0
  private paintedAltitude = -1
  private paintedSettled = false
  private paintedLaunch = 0
  private launchArmed = false
  private launchProgress = 0
  private launchGlow = 0
  private flightOrigin = 0
  private flightTime = 0
  private flightDuration = 0
  private flightVelocity = 0
  private carryVelocity = 0

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hero: Element,
    private readonly onHeroReady: () => void,
    private readonly onAltitude: (altitude: number, settled: boolean, launch: number) => void,
  ) {
    this.palette = new CanvasPalette(canvas)
    this.motion.addEventListener('change', this.motionChange)
    document.addEventListener('visibilitychange', this.visibilityChange)
    window.addEventListener('pointermove', this.pointerMove, { passive: true })
    window.addEventListener('blur', this.pointerLeave)
    document.documentElement.addEventListener('pointerleave', this.pointerLeave)
  }

  start(immediate = false): void {
    if (this.started || this.destroyed) return
    this.started = true
    if (immediate || this.motion.matches) this.clock = SUNRISE
    if (this.motion.matches) this.skipFlight()
    this.resize()
    this.observer.observe(this.canvas)
    this.observer.observe(this.hero)
    this.resume()
  }

  setDestination(inSpace: boolean): void {
    const destination = inSpace ? 1 : 0
    if (destination === this.destination) return
    this.launchArmed = inSpace && this.altitude === 0 && this.flightTime >= this.flightDuration
    this.destination = destination
    this.flightOrigin = this.altitude
    this.carryVelocity = this.flightVelocity
    this.flightTime = 0
    const travelTime = inSpace ? ASCENT_SECONDS : DESCENT_SECONDS
    this.flightDuration = Math.max(0.3, Math.abs(destination - this.altitude) * travelTime)
    this.nextPaint = 0
    if (this.motion.matches) this.skipFlight()
    else if (this.altitude === destination && this.flightVelocity === 0) this.finishFlight()
    if (!this.started) return
    if (this.motion.matches) this.draw()
    else this.resume()
  }

  private finishFlight(): void {
    this.altitude = this.destination
    this.flightTime = this.flightDuration
    this.flightVelocity = 0
  }

  private skipFlight(): void {
    this.launchArmed = false
    this.launchProgress = this.launchGlow = 0
    this.finishFlight()
  }

  private advanceLaunch(dt: number): number {
    if (this.launchArmed) {
      const remaining = (1 - this.launchProgress) * LAUNCH_SECONDS
      this.launchProgress = dt < remaining ? this.launchProgress + dt / LAUNCH_SECONDS : 1
      const cue = this.launchProgress
      this.launchGlow = smooth((cue - 0.04) / 0.40) * (1 - smooth((cue - 0.44) / 0.49))
      if (dt < remaining) return 0
      this.launchArmed = false
      return dt - remaining
    }

    if (this.launchGlow > 0) {
      this.launchGlow *= Math.exp(-dt / 0.12)
      if (this.launchGlow < 0.004) this.launchGlow = 0
    }
    if (this.launchProgress > 0) {
      if (this.altitude >= 0.26) this.launchProgress = 0
      else if (this.destination === 0) this.launchProgress = Math.max(0, this.launchProgress - dt / LAUNCH_RECOVERY_SECONDS)
      else this.launchProgress = Math.min(1, this.launchProgress + dt / LAUNCH_SECONDS)
    }
    return dt
  }

  private advanceFlight(dt: number): void {
    this.flightTime += dt
    if (this.flightTime >= this.flightDuration) return this.finishFlight()
    const travel = (this.destination - this.flightOrigin) * flightEase(this.flightTime / this.flightDuration)
    // Carry the previous shot's momentum into the turn and taper it away before continuing.
    const taper = Math.max(0, 1 - this.flightTime / Math.min(0.22, this.flightDuration * 0.5))
    const altitude = this.flightOrigin + travel + this.carryVelocity * this.flightTime * taper ** 3
    this.flightVelocity = (altitude - this.altitude) / dt
    this.altitude = altitude
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
    const altitude = this.altitude
    const flying = !this.launchArmed && this.clock > SUNRISE && this.flightTime < this.flightDuration
    const grounded = !flying && altitude === 0
    // A moving horizon invalidates the cached foreground in both directions.
    const reuseGround = grounded && this.sceneryPainted
    const bottom = reuseGround ? this.dynamicBottom : this.canvas.height
    if (reuseGround) {
      ctx.save()
      ctx.beginPath()
      const cssScale = this.height / this.canvas.height
      ctx.rect(0, 0, this.width, bottom * cssScale)
      ctx.clip()
    }
    const camera = still ? 0 : this.camera
    const groundOffset = altitude * this.height * GROUND_TRAVEL
    const time = still ? 0 : this.clock
    const elevation = this.sky.draw(ctx, rise, time, camera, altitude, groundOffset,
      this.launchGlow, this.launchProgress, still ? 0 : this.earthSteer)
    if (groundOffset + this.height * (HORIZON - 0.1) < this.height) {
      if (!grounded) {
        ctx.save()
        ctx.translate(0, groundOffset)
      }
      this.meadow.draw(ctx, still ? SUNRISE : time, elevation, camera)
      if (!grounded) ctx.restore()
    }
    if (reuseGround) ctx.restore()
    this.palette.present(bottom)
    this.sceneryPainted = grounded && progress === 1
    this.setState(this.launchArmed && this.launchProgress > 0 ? 'launch' : flying ? 'flight' : altitude === 1 ? 'space'
      : still ? 'still' : progress < 1 ? 'sunrise' : 'daylight')
    const settled = !flying && this.flightTime >= this.flightDuration && this.launchProgress === 0
    if (this.paintedAltitude !== altitude || this.paintedSettled !== settled || this.paintedLaunch !== this.launchProgress) {
      this.paintedAltitude = altitude
      this.paintedSettled = settled
      this.paintedLaunch = this.launchProgress
      this.onAltitude(altitude, settled, this.launchProgress)
    }
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
    if (this.previousFrame !== null) {
      const dt = (now - this.previousFrame) / 1000
      this.clock += dt
      if (dt > 0 && this.clock > SUNRISE) {
        const travel = this.advanceLaunch(Math.min(dt, this.clock - SUNRISE))
        if (travel > 0 && this.flightTime < this.flightDuration) this.advanceFlight(travel)
      }
      const landed = this.flightTime >= this.flightDuration
      if (landed && this.altitude === 0) {
        const target = this.pointerSteer * cameraTravel(this.width) * 0.5
        const gap = target - this.camera
        this.camera = Math.abs(gap) < 0.03 ? target : this.camera + gap * -Math.expm1(-dt / 0.17)
      }
      // The Earth picks up the pointer only at orbital rest; on descent it eases back into the flight.
      const earthTarget = landed && this.altitude === 1 ? this.pointerSteer : 0
      const earthGap = earthTarget - this.earthSteer
      this.earthSteer = Math.abs(earthGap) < 0.001
        ? earthTarget : this.earthSteer + earthGap * -Math.expm1(-dt / 0.24)
    }
    this.previousFrame = now
    if (now >= this.nextPaint - 0.5) {
      const interval = this.state === 'space' && this.destination === 1 ? ORBIT_FRAME_TIME : FRAME_TIME
      this.nextPaint = this.nextPaint === 0 ? now + interval
        : this.nextPaint + (1 + Math.floor((now - this.nextPaint + 0.5) / interval)) * interval
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

  private pointerMove = (event: PointerEvent): void => {
    if (!this.started || this.motion.matches || event.pointerType !== 'mouse') return
    const position = Math.max(-1, Math.min(1, (event.clientX / this.width) * 2 - 1))
    // Keep small motions near center calmer than the sweep toward the edges.
    this.pointerSteer = position * (CURSOR_CENTER_GAIN + (1 - CURSOR_CENTER_GAIN) * position * position)
  }

  private pointerLeave = (): void => { this.pointerSteer = 0 }

  private visibilityChange = (): void => {
    if (document.hidden) {
      this.pointerLeave()
      this.stop()
    } else if (this.started && this.motion.matches) this.draw()
    else this.resume()
  }

  private motionChange = (): void => {
    if (!this.started) return
    this.stop()
    this.camera = this.pointerSteer = this.earthSteer = 0
    this.clock = Math.max(SUNRISE, this.clock)
    if (this.motion.matches) this.skipFlight()
    this.draw()
    this.resume()
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    this.observer.disconnect()
    this.motion.removeEventListener('change', this.motionChange)
    document.removeEventListener('visibilitychange', this.visibilityChange)
    window.removeEventListener('pointermove', this.pointerMove)
    window.removeEventListener('blur', this.pointerLeave)
    document.documentElement.removeEventListener('pointerleave', this.pointerLeave)
    this.setState('waiting')
  }
}
