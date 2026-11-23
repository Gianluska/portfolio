import { AsciiAtmosphere } from './AsciiAtmosphere'
import { DEPTH_CENTER, sceneScale, SEA_TILT, seaX, seaZ } from './AsciiPerspective'
import { AsciiSceneCamera } from './AsciiSceneCamera'
import { AsciiWaterfall, WATER_GLYPHS } from './AsciiWaterfall'

const TAU = Math.PI * 2
const DROP_TIME = 0.95
const REVEAL_TIME = 2.8
const HERO_START = Math.max(0, DROP_TIME + REVEAL_TIME - 3)
const FRAME_TIME = 1000 / 30
// Sea palette: troughs fade out, slopes read as dashes, crests as tildes, sun glints sparkle.
const GLYPHS = WATER_GLYPHS
const DOT = 1, DASH = 2, TILDE = 3, PLUS = 4, STAR = 5
// Two long swells shade the sea broadly; a gentle, narrow-angle wind sea draws wide, soft crests.
const SWELLS = 2
const SWELL_LIFT = 0.35
// Visual wave height: scales slope-driven light and crest/trough contrast, not the pattern.
const WAVE_HEIGHT = 0.35
// Pointer wake: a damped 2D wave equation on the glyph grid, stepped at 60 Hz.
// The pointer presses the surface; rings and a V-shaped wake spread from its path.
const RIPPLE_STEP = 1 / 60
const RIPPLE_SPEED = 170
const RIPPLE_DAMPING = 0.994
const RIPPLE_RADIUS = 2.2
const RIPPLE_PUSH = 0.0424
// The hull is broader than a fingertip; it pushes a little harder than the old pointer wake.
const BOAT_PUSH = 1.15
// A cannonball splash slaps the sea much harder than the gliding hull.
const SHOT_PUSH = 4
const RIPPLE_LEVEL = 0.7
const RIPPLE_SLOPE = 2
const RIPPLE_SHIFT = 15
const RIPPLE_SHIFT_MAX = 0.5
// Absorbing border: waves fade over this band instead of bouncing off the viewport edge.
const SPONGE_WIDTH = 90
const SPONGE_LOSS = 0.3
const WAVES = [
  { wavelength: 5, amplitude: 0.06, angle: 0.06, phase: 0.4 },
  { wavelength: 3.6, amplitude: 0.045, angle: -0.16, phase: 2.7 },
  { wavelength: 2, amplitude: 0.03, angle: 0.2, phase: 4.1 },
  { wavelength: 1.6, amplitude: 0.024, angle: -0.12, phase: 1.2 },
  { wavelength: 1.3, amplitude: 0.017, angle: 0.32, phase: 3.5 },
  { wavelength: 1.05, amplitude: 0.012, angle: -0.26, phase: 5.2 },
  { wavelength: 0.88, amplitude: 0.008, angle: 0.08, phase: 0.9 },
  { wavelength: 0.74, amplitude: 0.005, angle: -0.35, phase: 2.2 },
].map((wave) => {
  const k = TAU / wave.wavelength
  const kx = Math.sin(wave.angle) * k, kz = Math.cos(wave.angle) * k
  return {
    kx, kz, amplitude: wave.amplitude, phase: wave.phase,
    dx: wave.amplitude * kx, dz: wave.amplitude * kz,
    speed: Math.sqrt(1.25 * k) * 0.32,
  }
})
// Pitched view; the same low sun keeps the broad swells softly lit.
const SUN_X = 0.2, SUN_Z = 0.24
const HALF_HEIGHT = Math.hypot(SUN_X, 0.95, SUN_Z) + 0.95
const REFLECTION_X = SUN_X / HALF_HEIGHT
const REFLECTION_Z = SUN_Z / HALF_HEIGHT
const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value))

function noise(x: number, y: number): number {
  let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295
}

// Opaque grey pixel words indexed by level, built through bytes so they hold on any endianness.
const GREY = new Uint32Array(new Uint8ClampedArray(
  Array.from({ length: 256 }, (_, level) => [level, level, level, 255]).flat(),
).buffer)

type RiverState = 'waiting' | 'falling' | 'ripple' | 'flowing' | 'still'

/** A small falling drop opens a quiet, full-viewport ASCII water surface. */
export class AsciiRiver {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly atlas = document.createElement('canvas')
  private readonly actorsCanvas = document.createElement('canvas')
  private readonly actorsContext = this.actorsCanvas.getContext('2d')!
  // Water is the first layer over opaque black, so it is composited straight into
  // final grey pixels and put onto the visible canvas with no intermediate copy.
  private waterPixels!: ImageData
  private waterWords!: Uint32Array
  private readonly glyphMasks: Uint8Array[] = []
  // Inked pixels only, as offsets into the scene buffer; built with the atlas.
  private readonly glyphOffsets: Int32Array[] = []
  private readonly glyphLevels: Uint8Array[] = []
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer: ResizeObserver
  private readonly atmosphere = new AsciiAtmosphere()
  private readonly camera = new AsciiSceneCamera()
  private readonly waterfall = new AsciiWaterfall()
  private scrollProgress = 0
  private covered = false
  private scrollEnd = 1
  private projectedProgress = -1
  private state: RiverState = 'waiting'
  private started = false
  private destroyed = false
  private heroStarted = false
  private raf = 0
  private last = 0
  private painted = 0
  private elapsed = 0
  // Latch first bottom contact so resizing cannot restart an already-entering ship.
  private boatEntry = Number.NaN
  private width = 0
  private height = 0
  private dpr = 1
  private cellWidth = 8
  private cellHeight = 12
  private tileWidth = 1
  private tileHeight = 1
  private glyphSlot = new Uint16Array(0)
  private readonly glyphWidth: number[] = []
  private readonly glyphHeight: number[] = []
  private reach = 1
  private count = 0
  private worldScale = 1
  private waterAge = -1
  private luminance!: Float32Array
  private x!: Float32Array
  private y!: Float32Array
  private planeX!: Float32Array
  private planeZ!: Float32Array
  private distance!: Float32Array
  private spatialSine!: Float32Array
  private spatialCosine!: Float32Array
  private sampleWeight = new Float32Array(0)
  private rowNorm = new Float32Array(0)
  private rowScale = new Float32Array(0)
  private rowInverseZ = new Float32Array(0)
  private gustSine!: Float32Array
  private gustCosine!: Float32Array
  private readonly timeSine = new Float32Array(WAVES.length)
  private readonly timeCosine = new Float32Array(WAVES.length)
  private cols = 0
  private rows = 0
  private ripple = new Float32Array(0)
  private ripplePrev = new Float32Array(0)
  private rippleSponge = new Float32Array(0)
  private rippleActive = false
  private rippleClock = 0
  private pointerX = Number.NaN
  private pointerY = 0
  private hullX = Number.NaN
  private hullY = 0
  private bottomContact = 1

  constructor(
    canvas: HTMLCanvasElement, private readonly onHeroReady: () => void,
    private readonly onScrollCopy: (progress: number) => void, private readonly landing: HTMLElement,
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('The ASCII river requires a 2D canvas context')
    this.ctx = ctx
    this.observer = new ResizeObserver(this.resize)
    document.addEventListener('visibilitychange', this.visibility)
    this.motion.addEventListener('change', this.motionChange)
    window.addEventListener('pointermove', this.pointer, { passive: true })
    window.addEventListener('pointerdown', this.fire)
    window.addEventListener('pointerout', this.pointerGone, { passive: true })
    window.addEventListener('pointerup', this.pointerGone, { passive: true })
    window.addEventListener('pointercancel', this.pointerGone, { passive: true })
    window.addEventListener('scroll', this.scroll, { passive: true })
    document.fonts.ready.then(() => {
      if (this.started && !this.destroyed) {
        this.buildAtlas()
        this.draw()
      }
    })
  }

  start(immediate = false): void {
    if (this.started || this.destroyed) return
    this.started = true
    this.elapsed = immediate || this.motion.matches ? DROP_TIME + REVEAL_TIME + 4 : 0
    this.build()
    this.observer.observe(this.canvas)
    this.draw()
    this.resume()
  }

  setCovered(covered: boolean): void {
    if (this.covered === covered) return
    this.covered = covered
    if (covered) this.stop()
    else if (this.started && this.motion.matches && !document.hidden) this.draw()
    else this.resume()
  }

  private setState(state: RiverState): void {
    if (this.state === state) return
    this.state = state
    this.canvas.dataset.state = state
  }

  private build(): void {
    const box = this.canvas.getBoundingClientRect()
    this.width = Math.max(1, box.width)
    this.height = Math.max(1, box.height)
    this.scrollEnd = Math.max(1, this.landing.offsetTop)
    this.scrollProgress = clamp(window.scrollY / this.scrollEnd)
    this.updateCamera()
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1)
    this.cellWidth = this.width < 640 ? 7 : 8
    this.cellHeight = this.width < 640 ? 10 : 12
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.actorsCanvas.width = this.canvas.width
    this.actorsCanvas.height = this.canvas.height
    this.waterPixels = this.ctx.createImageData(this.canvas.width, this.canvas.height)
    this.waterWords = new Uint32Array(this.waterPixels.data.buffer)
    const farX = seaX(0, 0, this.width, this.height)
    const nearX = seaX(0, this.height, this.width, this.height)
    const farZ = seaZ(0, this.height), nearZ = seaZ(this.height, this.height)
    this.reach = Math.max(Math.hypot(farX, farZ), Math.hypot(nearX, nearZ)) + 64
    this.bottomContact = nearZ
    const cols = Math.ceil(this.width / this.cellWidth)
    const rows = Math.ceil(this.height / this.cellHeight)
    this.count = cols * rows
    this.cols = cols
    this.rows = rows
    this.ripple = new Float32Array(this.count)
    this.ripplePrev = new Float32Array(this.count)
    this.rippleActive = false
    this.hullX = Number.NaN
    this.rippleClock = 0
    // Quadratic ramp from interior (no loss) to the edge, so the band itself doesn't reflect.
    this.rippleSponge = new Float32Array(this.count)
    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * this.cellHeight
      const edgeY = Math.min(y, this.height - y)
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5) * this.cellWidth
        const edge = Math.min(edgeY, Math.min(x, this.width - x))
        const depth = Math.max(0, 1 - edge / SPONGE_WIDTH)
        this.rippleSponge[row * cols + col] = 1 - SPONGE_LOSS * depth * depth
      }
    }
    this.waterAge = -1
    this.luminance = new Float32Array(this.count)
    this.x = new Float32Array(this.count)
    this.y = new Float32Array(this.count)
    this.planeX = new Float32Array(this.count)
    this.planeZ = new Float32Array(this.count)
    this.distance = new Float32Array(this.count)
    this.spatialSine = new Float32Array(this.count * WAVES.length)
    this.spatialCosine = new Float32Array(this.count * WAVES.length)
    this.gustSine = new Float32Array(this.count)
    this.gustCosine = new Float32Array(this.count)
    this.worldScale = 8 / Math.max(this.height, 640)
    this.sampleWeight = new Float32Array(rows * WAVES.length)
    this.rowNorm = new Float32Array(rows)
    this.rowScale = new Float32Array(rows)
    this.rowInverseZ = new Float32Array(rows)
    this.projectWater()
    this.updateScrollCopy()
    this.buildAtlas()
  }

  /** Reproject only when the camera changes; phase recurrences avoid per-cell trig. */
  private projectWater(): void {
    const { camera, height, width, cols, rows } = this
    this.projectedProgress = this.scrollProgress
    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * this.cellHeight
      const planeZ = camera.worldZ(Math.min(y, camera.lipY), height)
      const scale = camera.scale(planeZ, height)
      const depth = DEPTH_CENTER * scale
      this.rowScale[row] = depth
      const inverseX = 1 / scale
      const inverseZ = camera.inverseSlope(Math.min(y, camera.lipY), height)
      this.rowInverseZ[row] = inverseZ
      const shear = width * 0.5 * camera.perspective / (height * camera.zoom) * inverseZ
      const worldZ = planeZ * this.worldScale
      let variance = 0
      for (let w = 0; w < WAVES.length; w++) {
        const wave = WAVES[w]
        const footprint = (Math.abs(wave.kx) * (this.cellWidth * inverseX + this.cellHeight * shear)
          + Math.abs(wave.kz) * this.cellHeight * inverseZ) * this.worldScale
        const weight = clamp((Math.PI - footprint) / (Math.PI * 0.5))
        this.sampleWeight[row * WAVES.length + w] = weight
        const amplitude = wave.amplitude * weight * (w < SWELLS ? SWELL_LIFT : 1)
        variance += amplitude * amplitude * 0.5
      }
      this.rowNorm[row] = 1 / Math.max(0.001, 2 * Math.sqrt(variance))
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col
        const x = (col + 0.5) * this.cellWidth
        const planeX = (x - width / 2) * inverseX
        this.x[i] = x
        this.y[i] = y
        this.planeX[i] = planeX
        this.planeZ[i] = planeZ
        this.distance[i] = Math.hypot(planeX, planeZ)
        const phase = planeX * this.worldScale * 0.28 + worldZ * 0.18
        this.gustSine[i] = Math.sin(phase)
        this.gustCosine[i] = Math.cos(phase)
      }
      for (let w = 0; w < WAVES.length; w++) {
        const wave = WAVES[w]
        const phase = wave.kx * this.planeX[row * cols] * this.worldScale + wave.kz * worldZ + wave.phase
        const step = wave.kx * this.cellWidth * inverseX * this.worldScale
        const stepSine = Math.sin(step), stepCosine = Math.cos(step)
        let sine = Math.sin(phase), cosine = Math.cos(phase)
        for (let col = 0; col < cols; col++) {
          const slot = (row * cols + col) * WAVES.length + w
          this.spatialSine[slot] = sine
          this.spatialCosine[slot] = cosine
          const nextSine = sine * stepCosine + cosine * stepSine
          cosine = cosine * stepCosine - sine * stepSine
          sine = nextSine
        }
      }
    }
  }

  private updateScrollCopy(): void {
    this.onScrollCopy(this.scrollProgress)
    this.canvas.dataset.scene = this.scrollProgress === 0 ? 'sea'
      : this.scrollProgress === 1 ? 'waterfall' : 'transition'
  }

  private scroll = (): void => {
    this.scrollProgress = clamp(window.scrollY / this.scrollEnd)
    if (this.scrollProgress > 0.03) this.pointerX = Number.NaN
    this.updateScrollCopy()
    if (this.started && this.motion.matches && !document.hidden) this.draw()
  }

  private updateCamera(): void {
    const still = this.motion.matches
    this.camera.update(still ? Number(this.scrollProgress >= 0.5) : this.scrollProgress, this.height, !still)
  }

  private readonly plotFall = (glyph: number, x: number, y: number, alpha: number): void => {
    this.glyph(glyph, x, y, alpha)
  }

  private buildAtlas(): void {
    this.tileWidth = Math.ceil(this.cellWidth * 1.05 * this.dpr)
    this.tileHeight = Math.ceil(this.cellHeight * 1.065 * this.dpr)
    this.glyphSlot = new Uint16Array(this.rows)
    this.glyphWidth.length = 0
    this.glyphHeight.length = 0
    const sizes = new Map<number, number>()
    for (let row = 0; row < this.rows; row++) {
      const depth = sceneScale((row + 0.5) * this.cellHeight, this.height)
      const width = Math.round(this.cellWidth * (0.5 + depth * 0.5) * this.dpr)
      const height = Math.round(this.cellHeight * (0.35 + depth * 0.65) * this.dpr)
      const key = width * 256 + height
      let slot = sizes.get(key)
      if (slot === undefined) {
        slot = sizes.size
        sizes.set(key, slot)
        this.glyphWidth.push(width)
        this.glyphHeight.push(height)
      }
      this.glyphSlot[row] = slot
    }
    this.atlas.width = this.tileWidth * GLYPHS.length
    this.atlas.height = this.tileHeight * sizes.size
    const ctx = this.atlas.getContext('2d')!
    ctx.font = `400 ${this.cellHeight * 0.83 * this.dpr}px "Geist Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    for (let slot = 0; slot < sizes.size; slot++) {
      const width = this.glyphWidth[slot], height = this.glyphHeight[slot]
      for (let i = 1; i < GLYPHS.length; i++) {
        ctx.save()
        ctx.translate(i * this.tileWidth + width / 2, slot * this.tileHeight + height / 2)
        ctx.scale(width / (this.cellWidth * this.dpr), height / (this.cellHeight * this.dpr))
        ctx.fillText(GLYPHS[i], 0, 0)
        ctx.restore()
      }
    }
    // Read coverage only when rebuilding; frames never read back the visible canvas.
    const pixels = ctx.getImageData(0, 0, this.atlas.width, this.atlas.height).data
    this.glyphMasks.length = 0
    this.glyphOffsets.length = 0
    this.glyphLevels.length = 0
    const stride = this.canvas.width
    for (let slot = 0; slot < sizes.size; slot++) {
      const width = this.glyphWidth[slot], height = this.glyphHeight[slot]
      for (let glyph = 0; glyph < GLYPHS.length; glyph++) {
        const mask = new Uint8Array(width * height)
        const offsets: number[] = [], levels: number[] = []
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const pixel = ((slot * this.tileHeight + y) * this.atlas.width + glyph * this.tileWidth + x) * 4
            const level = pixels[pixel + 3]
            mask[y * width + x] = level
            if (level) {
              offsets.push(y * stride + x)
              levels.push(level)
            }
          }
        }
        this.glyphMasks.push(mask)
        this.glyphOffsets.push(Int32Array.from(offsets))
        this.glyphLevels.push(Uint8Array.from(levels))
      }
    }
  }

  private glyph(index: number, x: number, y: number, alpha: number, row = this.rows - 1): void {
    if (alpha < 1 / 255) return
    const slot = this.glyphSlot[row]
    const width = this.glyphWidth[slot], height = this.glyphHeight[slot]
    const opacity = Math.min(1, alpha)
    const mask = slot * GLYPHS.length + index
    const left = Math.round(x * this.dpr - width / 2)
    const top = Math.round(y * this.dpr - height / 2)
    const bytes = this.waterPixels.data, words = this.waterWords
    const stride = this.waterPixels.width
    // Source-over white on the grey below: the level is the accumulated coverage.
    if (left >= 0 && top >= 0 && left + width <= stride && top + height <= this.waterPixels.height) {
      // Interior glyphs touch only their inked pixels, a small share of each tile.
      const offsets = this.glyphOffsets[mask], levels = this.glyphLevels[mask]
      const origin = top * stride + left
      for (let k = 0; k < offsets.length; k++) {
        const a = Math.round(levels[k] * opacity)
        if (!a) continue
        const pixel = origin + offsets[k]
        const below = bytes[pixel << 2]
        words[pixel] = GREY[Math.round(a + below * (1 - a / 255))]
      }
      return
    }
    const coverage = this.glyphMasks[mask]
    const x0 = Math.max(0, -left), x1 = Math.min(width, stride - left)
    const y0 = Math.max(0, -top), y1 = Math.min(height, this.waterPixels.height - top)
    for (let y = y0; y < y1; y++) {
      let pixel = (top + y) * stride + left + x0
      for (let x = x0, m = y * width + x0; x < x1; x++, m++, pixel++) {
        const a = Math.round(coverage[m] * opacity)
        if (!a) continue
        const below = bytes[pixel << 2]
        words[pixel] = GREY[Math.round(a + below * (1 - a / 255))]
      }
    }
  }

  private pointerGone = (event: PointerEvent): void => {
    const gone = event.type === 'pointerout' ? event.relatedTarget === null : event.pointerType !== 'mouse'
    if (gone) this.pointerX = Number.NaN
  }

  private pointer = (event: PointerEvent): void => {
    if (this.covered) return
    if (this.scrollProgress > 0.03 || (this.state !== 'ripple' && this.state !== 'flowing')) {
      this.pointerX = Number.NaN
      return
    }
    // On the sea, the pointer steers the boat; only its hull makes wakes and startles birds.
    const box = this.canvas.getBoundingClientRect()
    this.pointerX = event.clientX - box.left
    this.pointerY = event.clientY - box.top
  }

  private fire = (event: PointerEvent): void => {
    if (event.button !== 0 || event.pointerType !== 'mouse') return
    if (this.scrollProgress > 0.03 || (this.state !== 'ripple' && this.state !== 'flowing')) return
    // Clicks on links, controls and the hero copy keep their own meaning.
    const target = event.target
    if (target instanceof Element
      && target.closest('a, button, input, textarea, select, label, [role="button"], .hero__copy')) return
    this.atmosphere.boat.fire()
  }

  private pushShots(): void {
    const impacts = this.atmosphere.boat.impacts
    if (this.scrollProgress === 0) {
      for (const hit of impacts) {
        const depth = sceneScale(hit.y, this.height) / DEPTH_CENTER
        this.press(hit.x, hit.y, RIPPLE_PUSH * SHOT_PUSH * hit.strength * depth)
        this.rippleActive = true
      }
    }
    impacts.length = 0
  }

  private pushHull(): void {
    const boat = this.atmosphere.boat
    const wake = boat.wake
    if (wake < 0.05) {
      this.hullX = Number.NaN
      return
    }
    // Press just aft of amidships; splats stay a cell apart so the path is continuous.
    const x = boat.x - Math.cos(boat.heading) * 4
    const y = boat.y - Math.sin(boat.heading) * 4
    const previousX = this.hullX, previousY = this.hullY
    this.hullX = x
    this.hullY = y
    if (!Number.isFinite(previousX)) return
    const dx = x - previousX, dy = y - previousY
    const length = Math.hypot(dx, dy)
    if (length < 0.5 || length > 200) return
    const depth = sceneScale(y, this.height) / DEPTH_CENTER
    const strength = RIPPLE_PUSH * BOAT_PUSH * (0.25 + wake * 0.75) * depth
    const steps = Math.ceil(length / this.cellWidth)
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      this.press(previousX + dx * t, previousY + dy * t, strength)
    }
    this.rippleActive = true
  }

  private press(x: number, y: number, strength: number): void {
    // Zero-mean "Mexican hat": the centre sinks while a rim rises, so no net water
    // accumulates along the path and the first crest appears immediately.
    const col = x / this.cellWidth - 0.5, row = y / this.cellHeight - 0.5
    const depth = sceneScale(y, this.height)
    const scaleX = depth / DEPTH_CENTER
    const scaleZ = depth * depth * SEA_TILT / (DEPTH_CENTER * DEPTH_CENTER)
    const radius = RIPPLE_RADIUS * scaleX
    const aspect = this.cellHeight / this.cellWidth * scaleX / scaleZ
    const reachX = Math.ceil(radius * 4), reachY = Math.ceil(radius * 4 / aspect)
    const inverse = 1 / (2 * radius * radius)
    const top = Math.max(1, Math.round(row) - reachY), bottom = Math.min(this.rows - 2, Math.round(row) + reachY)
    const left = Math.max(1, Math.round(col) - reachX), right = Math.min(this.cols - 2, Math.round(col) + reachX)
    for (let r = top; r <= bottom; r++) {
      const offsetY = (r - row) * aspect
      for (let c = left; c <= right; c++) {
        const offsetX = c - col
        const i = r * this.cols + c
        const falloff = (offsetX * offsetX + offsetY * offsetY) * inverse
        this.ripple[i] = clamp(this.ripple[i] - strength * (1 - falloff) * Math.exp(-falloff), -1.5, 1.5)
      }
    }
  }

  private stepRipples(): void {
    const { cols, rows } = this
    const height = this.ripple, previous = this.ripplePrev, sponge = this.rippleSponge
    const baseX = (RIPPLE_SPEED * RIPPLE_STEP / this.cellWidth) ** 2
    const baseZ = (RIPPLE_SPEED * RIPPLE_STEP / this.cellHeight) ** 2
    let peak = 0
    // Leapfrog update written into the previous buffer; the sponge band absorbs outgoing waves.
    for (let row = 1; row < rows - 1; row++) {
      const depth = this.rowScale[row] / DEPTH_CENTER
      const courantX = baseX * depth * depth
      const vertical = depth * depth * SEA_TILT
      const courantZ = baseZ * vertical * vertical
      for (let col = 1, i = row * cols + 1; col < cols - 1; col++, i++) {
        const current = height[i]
        // Damp only the velocity term: damping height itself would act as a reflecting step.
        const next = (current + (current - previous[i]) * RIPPLE_DAMPING * sponge[i]
          + courantX * (height[i - 1] + height[i + 1] - 2 * current)
          + courantZ * (height[i - cols] + height[i + cols] - 2 * current)) * 0.999
        previous[i] = next
        const magnitude = next < 0 ? -next : next
        if (magnitude > peak) peak = magnitude
      }
    }
    this.ripple = previous
    this.ripplePrev = height
    if (peak < 0.003) {
      this.ripple.fill(0)
      this.ripplePrev.fill(0)
      this.rippleActive = false
    }
  }

  private drawWater(age: number, radius: number): void {
    // Sum-of-sines surface + analytic normals, following GPU Gems chapter 1.
    // Spatial trigonometry is cached; only the per-wave phases advance per frame.
    for (let w = 0; w < WAVES.length; w++) {
      this.timeSine[w] = Math.sin(WAVES[w].speed * age)
      this.timeCosine[w] = Math.cos(WAVES[w].speed * age)
    }
    const gustSine = Math.sin(age * 0.24), gustCosine = Math.cos(age * 0.24)
    const breezes = this.atmosphere.breezes
    const inverseWorldScale = 1 / this.worldScale
    // Filter light before choosing a glyph, keeping small reflections from flickering.
    const blend = this.motion.matches || this.waterAge < 0 || age < this.waterAge
      ? 1 : -Math.expm1(-8 * (age - this.waterAge))
    this.waterAge = age
    const impactStrength = age < REVEAL_TIME + 0.6 ? 1 / (1 + radius / this.reach * 0.7) : 0
    const ripple = this.ripple, cols = this.cols, rippling = this.rippleActive
    const lipBlend = this.cellHeight * 2
    for (let i = 0; i < this.count; i++) {
      const row = Math.floor(i / cols)
      if (this.y[i] >= this.camera.lipY) continue
      const depth = this.rowScale[row]
      const inverseX = DEPTH_CENTER / depth
      const inverseZ = this.rowInverseZ[row]
      const heightNorm = this.rowNorm[row]
      const edge = clamp((radius - this.distance[i]) / 24)
      const reveal = age >= REVEAL_TIME ? 1 : edge * edge * (3 - 2 * edge)
      if (!reveal) continue
      // The impact's travelling crest and trailing trough are part of the height field.
      const front = (this.distance[i] - radius + 32) / 36
      const wakeFront = front + 1.8
      const crest = impactStrength > 0 && Math.abs(front) < 3 ? Math.exp(-front * front) : 0
      const trough = impactStrength > 0 && Math.abs(wakeFront) < 3
        ? Math.exp(-wakeFront * wakeFront) * 0.35 : 0
      const impactHeight = (crest - trough) * 0.18 * impactStrength
      const impactSlope = (-2 * front * crest + 2 * wakeFront * trough)
        * 0.18 * impactStrength * inverseWorldScale / 36
      const inverseDistance = this.distance[i] > 0 ? 1 / this.distance[i] : 0
      // Pointer wake: height plus central-difference slope in pixels.
      let rippleHeight = 0, rippleX = 0, rippleZ = 0
      if (rippling) {
        rippleHeight = ripple[i]
        rippleX = ((ripple[i + 1] ?? 0) - (ripple[i - 1] ?? 0)) / (2 * this.cellWidth * inverseX)
        rippleZ = ((i + cols < this.count ? ripple[i + cols] : 0) - (i >= cols ? ripple[i - cols] : 0))
          / (2 * this.cellHeight * inverseZ)
      }
      const radialX = this.planeX[i] * inverseDistance
      const radialZ = this.planeZ[i] * inverseDistance
      const windSine = this.gustSine[i] * gustCosine - this.gustCosine[i] * gustSine
      const windCosine = this.gustCosine[i] * gustCosine + this.gustSine[i] * gustSine
      let pressure = 0, pressureX = 0, pressureZ = 0
      for (let b = 0; b < breezes.length; b++) {
        const breeze = breezes[b]
        if (breeze.strength <= 0) continue
        const dx = this.x[i] - breeze.x, dy = this.y[i] - breeze.y
        const falloff = dx * dx * breeze.inverseX + dy * dy * breeze.inverseY
        if (falloff > 12) continue
        const force = breeze.strength * Math.exp(-falloff)
        pressure += force
        pressureX -= 2 * dx * breeze.inverseX * inverseWorldScale / inverseX * force
        pressureZ -= 2 * dy * breeze.inverseY * inverseWorldScale / inverseZ * force
      }
      // Wind roughens only the short wind-sea components; swell stays untouched.
      const gust = 0.9 + 0.1 * windSine + pressure * 0.45
      const windX = 0.07 * windCosine + pressureX * 0.45
      const windZ = 0.045 * windCosine + pressureZ * 0.45
      let height = 0, swellX = 0, swellZ = 0
      let slopeX = impactSlope * radialX, slopeZ = impactSlope * radialZ
      for (let w = 0; w < WAVES.length; w++) {
        const wave = WAVES[w], slot = i * WAVES.length + w
        const sine = this.spatialSine[slot] * this.timeCosine[w] - this.spatialCosine[slot] * this.timeSine[w]
        const cosine = this.spatialCosine[slot] * this.timeCosine[w] + this.spatialSine[slot] * this.timeSine[w]
        const weight = this.sampleWeight[row * WAVES.length + w]
        if (w < SWELLS) {
          height += wave.amplitude * sine * weight * SWELL_LIFT
          swellX += wave.dx * cosine * weight
          swellZ += wave.dz * cosine * weight
          continue
        }
        height += wave.amplitude * sine * gust * weight
        // Include envelope derivatives so wind and reflected light agree.
        slopeX += (wave.dx * cosine * gust + wave.amplitude * sine * windX) * weight
        slopeZ += (wave.dz * cosine * gust + wave.amplitude * sine * windZ) * weight
      }
      slopeX = (slopeX - impactSlope * radialX + swellX) * WAVE_HEIGHT + impactSlope * radialX + rippleX * RIPPLE_SLOPE
      slopeZ = (slopeZ - impactSlope * radialZ + swellZ) * WAVE_HEIGHT + impactSlope * radialZ + rippleZ * RIPPLE_SLOPE
      const level = (height + impactHeight) * heightNorm + rippleHeight * RIPPLE_LEVEL
      // Swell faces toward the sun brighten broad areas; wind-sea facets add local relief.
      const facing = clamp(0.5 - (slopeX * SUN_X + slopeZ * SUN_Z) * 3
        - (swellX * SUN_X + swellZ * SUN_Z) * 4 * WAVE_HEIGHT)
      const reflectionX = (slopeX + REFLECTION_X) / 0.11
      const reflectionZ = (slopeZ + REFLECTION_Z) / 0.07
      const glint = Math.exp(-reflectionX * reflectionX - reflectionZ * reflectionZ)
      const target = clamp(facing * 0.85 + crest * impactStrength * 0.3 + Math.max(0, rippleHeight) * 0.15)
      const luminance = this.luminance[i] + (target - this.luminance[i]) * blend
      this.luminance[i] = luminance
      // Low relief: troughs stay readable and crests only slightly brighter.
      const body = smoothstep(-0.6, 0.6, level * WAVE_HEIGHT + impactHeight * heightNorm * 0.5
        + rippleHeight * 0.4)
      let glyph = level > 0.55 ? TILDE : level > 0.1 ? DASH : DOT
      let alpha = (0.17 + body * 0.42) * (0.65 + luminance * 0.4)
      // Wake crests catch a little extra light so the rings read over the wind sea.
      if (rippleHeight > 0) alpha += smoothstep(0.05, 0.6, rippleHeight) * 0.08
      // Sun glitter brightens the crest itself; only the hottest facets sparkle.
      if (glint > 0.4 && level > 0) {
        if (glint > 0.85 && level > 0.3) glyph = STAR
        else if (glyph === DOT) glyph = DASH
        alpha = Math.max(alpha, 0.3 + glint * 0.5)
      }
      const displacement = impactHeight * inverseWorldScale * 0.35
      // Refraction-like shift: glyphs lean down the wake's slope by a few pixels.
      const shiftX = clamp(-rippleX * RIPPLE_SHIFT, -RIPPLE_SHIFT_MAX, RIPPLE_SHIFT_MAX)
      const shiftY = clamp(-rippleZ * RIPPLE_SHIFT, -RIPPLE_SHIFT_MAX, RIPPLE_SHIFT_MAX)
      const x = this.x[i] + radialX * displacement / inverseX + shiftX
      const y = this.y[i] + radialZ * displacement / inverseZ + shiftY
      this.glyph(
        glyph,
        x, y,
        alpha * reveal * (0.48 + depth * 0.52)
          * smoothstep(0, lipBlend, this.camera.lipY - this.y[i]),
        this.scrollProgress > 0 ? Math.round(clamp((depth - 0.3) / 0.8) * (this.rows - 1)) : row,
      )
    }
  }


  private drawSplash(age: number): void {
    if (age > 0.75) return
    const fade = 1 - age / 0.75
    for (let i = 0; i < 18; i++) {
      const angle = i / 18 * TAU
      const speed = 55 + noise(i, 7) * 95
      const x = this.width / 2 + Math.cos(angle) * speed * age
      const y = this.height / 2 + Math.sin(angle) * speed * age * 0.45 - 95 * age + 170 * age * age
      this.glyph(age < 0.18 ? PLUS : DOT, x, y, fade * (0.4 + noise(i, 3) * 0.5))
    }
  }

  private drawDrop(): void {
    const progress = clamp(this.elapsed / DROP_TIME)
    const start = Math.min(112, this.height * 0.18)
    const y = start + (this.height / 2 - start) * progress * progress
    const ctx = this.ctx
    ctx.font = '400 11px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = 0.18 * progress
    ctx.fillText('.', this.width / 2, y - 34)
    ctx.globalAlpha = 0.35 * progress
    ctx.fillText('|', this.width / 2, y - 25)
    ctx.globalAlpha = clamp(progress * 7) * 0.9
    ctx.fillText('.', this.width / 2, y - 18)
    ctx.fillText('/\\', this.width / 2, y - 9)
    ctx.fillText('\\/', this.width / 2, y)
  }

  private draw(): void {
    if (this.covered) return
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.globalAlpha = 1
    if (this.projectedProgress !== this.scrollProgress) {
      this.updateCamera()
      if (this.camera.lipY > 0) this.projectWater()
      else this.projectedProgress = this.scrollProgress
    }
    if (!this.heroStarted && this.elapsed >= HERO_START) {
      this.heroStarted = true
      this.onHeroReady()
    }
    if (this.elapsed < DROP_TIME) {
      this.setState('falling')
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, this.width, this.height)
      this.drawDrop()
    } else {
      const age = this.elapsed - DROP_TIME
      this.setState(this.motion.matches ? 'still' : age < REVEAL_TIME ? 'ripple' : 'flowing')
      // Constant-speed propagation carries the crest beyond the viewport corners.
      const radius = this.reach * Math.min(age / REVEAL_TIME, 1.25)
      if (Number.isNaN(this.boatEntry) && radius >= this.bottomContact) this.boatEntry = age
      this.atmosphere.update(
        age - REVEAL_TIME, Number.isNaN(this.boatEntry) ? -1 : age - this.boatEntry,
        this.width, this.height, !this.motion.matches,
        this.scrollProgress > 0.03 ? Number.NaN : this.pointerX, this.pointerY,
      )
      if (this.scrollProgress === 0) this.pushHull()
      this.pushShots()
      // Opaque black under the water replaces a separate background fill.
      this.waterWords.fill(GREY[0])
      if (this.camera.lipY > 0) this.drawWater(age, radius)
      this.drawSplash(age)
      this.waterfall.draw(
        this.motion.matches ? 0 : age, this.width, this.height, this.cellWidth, this.cellHeight,
        this.camera, this.plotFall,
      )
      ctx.putImageData(this.waterPixels, 0, 0)
      const actorFade = 1 - smoothstep(0.06, 0.5, this.scrollProgress)
      if (actorFade > 0) {
        // Fully visible actors go straight onto the scene; only a fade needs its own layer.
        const layered = actorFade < 1
        const actors = layered ? this.actorsContext : ctx
        actors.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
        if (layered) actors.clearRect(0, 0, this.width, this.height)
        actors.save()
        const zoom = this.camera.zoom
        const pitch = zoom * this.camera.tilt / SEA_TILT
        actors.translate(this.width * (1 - zoom) / 2, this.camera.centerY - this.height * pitch / 2)
        actors.scale(zoom, pitch)
        this.atmosphere.draw(actors, this.camera)
        actors.restore()
        if (layered) {
          ctx.globalAlpha = actorFade
          ctx.drawImage(this.actorsCanvas, 0, 0, this.width, this.height)
        }
      }
    }
    ctx.globalAlpha = 1
  }

  private frame = (now: number): void => {
    this.raf = 0
    if (this.destroyed || document.hidden) return
    if (this.motion.matches) return this.motionChange()
    if (this.last) {
      const delta = Math.min(0.05, (now - this.last) / 1000)
      this.elapsed += delta
      if (this.rippleActive) {
        this.rippleClock += delta
        for (let steps = 0; this.rippleClock >= RIPPLE_STEP && steps < 4; steps++) {
          this.rippleClock -= RIPPLE_STEP
          this.stepRipples()
          if (!this.rippleActive) break
        }
        this.rippleClock = Math.min(this.rippleClock, RIPPLE_STEP)
      } else this.rippleClock = 0
    }
    this.last = now
    if (now - this.painted >= FRAME_TIME - 0.5) {
      this.draw()
      this.painted = now
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop(): void {
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.last = 0
    this.painted = 0
  }

  private resume(): void {
    if (this.started && !this.destroyed && !this.covered && !this.raf && !document.hidden && !this.motion.matches) {
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  private visibility = (): void => {
    if (document.hidden) this.stop()
    else if (this.motion.matches) this.draw()
    else this.resume()
  }

  private motionChange = (): void => {
    if (!this.started) return
    this.stop()
    this.elapsed = DROP_TIME + REVEAL_TIME + 4
    this.ripple.fill(0)
    this.ripplePrev.fill(0)
    this.rippleActive = false
    this.projectedProgress = -1
    this.hullX = Number.NaN
    this.draw()
    this.resume()
  }

  private resize = (): void => {
    if (!this.started || this.destroyed) return
    const box = this.canvas.getBoundingClientRect()
    if (Math.abs(box.width - this.width) < 1 && Math.abs(box.height - this.height) < 1
      && Math.min(1.5, window.devicePixelRatio || 1) === this.dpr) return
    this.build()
    this.draw()
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    this.observer.disconnect()
    document.removeEventListener('visibilitychange', this.visibility)
    this.motion.removeEventListener('change', this.motionChange)
    window.removeEventListener('pointermove', this.pointer)
    window.removeEventListener('pointerdown', this.fire)
    window.removeEventListener('pointerout', this.pointerGone)
    window.removeEventListener('pointerup', this.pointerGone)
    window.removeEventListener('pointercancel', this.pointerGone)
    window.removeEventListener('scroll', this.scroll)
    this.setState('waiting')
  }
}
