import { AsciiAtmosphere } from './AsciiAtmosphere'

const TAU = Math.PI * 2
const DROP_TIME = 0.95
const REVEAL_TIME = 2.8
const FRAME_TIME = 1000 / 30
const GLYPHS = ' .,:~=-/\\|+*%#@'
const SHADE_GLYPHS = [1, 3, 6, 4, 5, 10, 11, 12, 13, 14]
const WAVES = [
  { wavelength: 7.4, amplitude: 0.13, angle: -0.26, phase: 0.4 },
  { wavelength: 4.8, amplitude: 0.075, angle: 0.33, phase: 2.7 },
  { wavelength: 2.7, amplitude: 0.035, angle: -0.52, phase: 4.1 },
  { wavelength: 1.05, amplitude: 0.014, angle: 0.13, phase: 1.2 },
  { wavelength: 0.72, amplitude: 0.007, angle: -0.23, phase: 3.5 },
  { wavelength: 0.48, amplitude: 0.0035, angle: 0.31, phase: 5.2 },
].map((wave) => {
  const k = TAU / wave.wavelength
  const kx = Math.sin(wave.angle) * k, kz = Math.cos(wave.angle) * k
  return {
    kx, kz, amplitude: wave.amplitude, phase: wave.phase,
    dx: wave.amplitude * kx, dz: wave.amplitude * kz,
    speed: Math.sqrt(1.25 * k) * 0.55,
  }
})
// Overhead camera V=(0,1,0), with one elevated off-screen light.
const HALF_HEIGHT = Math.hypot(0.2, 0.95, 0.24) + 0.95
const REFLECTION_X = 0.2 / HALF_HEIGHT
const REFLECTION_Z = 0.24 / HALF_HEIGHT
const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value))

function noise(x: number, y: number): number {
  let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295
}


type RiverState = 'waiting' | 'falling' | 'ripple' | 'flowing' | 'still'

/** A small falling drop opens a quiet, full-viewport ASCII water surface. */
export class AsciiRiver {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly atlas = document.createElement('canvas')
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer: ResizeObserver
  private readonly atmosphere = new AsciiAtmosphere()
  private state: RiverState = 'waiting'
  private started = false
  private destroyed = false
  private raf = 0
  private last = 0
  private painted = 0
  private elapsed = 0
  private width = 0
  private height = 0
  private dpr = 1
  private cellWidth = 8
  private cellHeight = 12
  private tileWidth = 1
  private tileHeight = 1
  private reach = 1
  private count = 0
  private worldScale = 1
  private waterAge = -1
  private luminance!: Float32Array
  private x!: Float32Array
  private y!: Float32Array
  private distance!: Float32Array
  private spatialSine!: Float32Array
  private spatialCosine!: Float32Array
  private readonly sampleWeight = new Float32Array(WAVES.length)
  private gustSine!: Float32Array
  private gustCosine!: Float32Array
  private readonly timeSine = new Float32Array(WAVES.length)
  private readonly timeCosine = new Float32Array(WAVES.length)
  private shades: number[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('The ASCII river requires a 2D canvas context')
    this.ctx = ctx
    this.observer = new ResizeObserver(this.resize)
    document.addEventListener('visibilitychange', this.visibility)
    this.motion.addEventListener('change', this.motionChange)
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

  private setState(state: RiverState): void {
    if (this.state === state) return
    this.state = state
    this.canvas.dataset.state = state
  }

  private build(): void {
    const box = this.canvas.getBoundingClientRect()
    this.width = Math.max(1, box.width)
    this.height = Math.max(1, box.height)
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1)
    this.cellWidth = this.width < 640 ? 7 : 8
    this.cellHeight = this.width < 640 ? 10 : 12
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.reach = Math.hypot(this.width / 2, this.height / 2) + 64
    const cols = Math.ceil(this.width / this.cellWidth)
    const rows = Math.ceil(this.height / this.cellHeight)
    this.count = cols * rows
    this.waterAge = -1
    this.luminance = new Float32Array(this.count)
    this.x = new Float32Array(this.count)
    this.y = new Float32Array(this.count)
    this.distance = new Float32Array(this.count)
    this.spatialSine = new Float32Array(this.count * WAVES.length)
    this.spatialCosine = new Float32Array(this.count * WAVES.length)
    this.gustSine = new Float32Array(this.count)
    this.gustCosine = new Float32Array(this.count)
    // Uniform orthographic scale across the entire surface, including the top.
    this.worldScale = 8 / Math.max(this.height, 640)
    for (let w = 0; w < WAVES.length; w++) {
      const wave = WAVES[w]
      const footprint = Math.abs(wave.kx * this.cellWidth * this.worldScale) + Math.abs(wave.kz * this.cellHeight * this.worldScale)
      this.sampleWeight[w] = clamp((Math.PI - footprint) / (Math.PI * 0.5))
    }
    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * this.cellHeight
      const worldZ = (y - this.height / 2) * this.worldScale
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col
        const x = (col + 0.5) * this.cellWidth
        const worldX = (x - this.width / 2) * this.worldScale
        this.x[i] = x
        this.y[i] = y
        this.distance[i] = Math.hypot(x - this.width / 2, y - this.height / 2)
        this.gustSine[i] = Math.sin(worldX * 0.28 + worldZ * 0.18)
        this.gustCosine[i] = Math.cos(worldX * 0.28 + worldZ * 0.18)
        for (let w = 0; w < WAVES.length; w++) {
          const wave = WAVES[w], slot = i * WAVES.length + w
          const phase = wave.kx * worldX + wave.kz * worldZ + wave.phase
          this.spatialSine[slot] = Math.sin(phase)
          this.spatialCosine[slot] = Math.cos(phase)
        }
      }
    }
    this.buildAtlas()
  }

  private buildAtlas(): void {
    this.tileWidth = Math.ceil(this.cellWidth * this.dpr)
    this.tileHeight = Math.ceil(this.cellHeight * this.dpr)
    this.atlas.width = this.tileWidth * GLYPHS.length
    this.atlas.height = this.tileHeight
    const ctx = this.atlas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.font = `400 ${this.cellHeight * 0.83 * this.dpr}px "Geist Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 1; i < GLYPHS.length; i++) {
      ctx.fillText(GLYPHS[i], (i + 0.5) * this.tileWidth, this.tileHeight * 0.5)
    }
    // Match tone to actual ink coverage in the loaded font, not glyph names.
    const pixels = ctx.getImageData(0, 0, this.atlas.width, this.atlas.height).data
    const ink = new Float32Array(GLYPHS.length)
    for (const glyph of SHADE_GLYPHS) {
      for (let y = 0; y < this.tileHeight; y++) {
        for (let x = 0; x < this.tileWidth; x++) {
          ink[glyph] += pixels[(y * this.atlas.width + glyph * this.tileWidth + x) * 4 + 3]
        }
      }
    }
    this.shades = SHADE_GLYPHS.slice().sort((a, b) => ink[a] - ink[b])
  }

  private glyph(index: number, x: number, y: number, alpha: number): void {
    if (alpha < 0.025) return
    this.ctx.globalAlpha = Math.min(1, alpha)
    this.ctx.drawImage(
      this.atlas, index * this.tileWidth, 0, this.tileWidth, this.tileHeight,
      x - this.cellWidth / 2, y - this.cellHeight / 2, this.cellWidth, this.cellHeight,
    )
  }

  private drawWater(age: number, radius: number): void {
    // Sum-of-sines surface + analytic normals, following GPU Gems chapter 1.
    // Spatial trigonometry is cached; only these six phases advance per frame.
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
    for (let i = 0; i < this.count; i++) {
      const edge = clamp((radius - this.distance[i]) / 24)
      const reveal = edge * edge * (3 - 2 * edge)
      if (!reveal) continue
      // A travelling elevation crest and its trailing trough belong to the surface.
      // Differentiate the same height profile for the water's reflection normals.
      const front = (this.distance[i] - radius + 32) / 36
      const wakeFront = front + 1.8
      const crest = impactStrength > 0 && Math.abs(front) < 3 ? Math.exp(-front * front) : 0
      const trough = impactStrength > 0 && Math.abs(wakeFront) < 3
        ? Math.exp(-wakeFront * wakeFront) * 0.35 : 0
      const height = (crest - trough) * 0.18 * impactStrength
      const derivative = (-2 * front * crest + 2 * wakeFront * trough)
        * 0.18 * impactStrength * inverseWorldScale / 36
      const inverseDistance = this.distance[i] > 0 ? 1 / this.distance[i] : 0
      const radialX = (this.x[i] - this.width / 2) * inverseDistance
      const radialZ = (this.y[i] - this.height / 2) * inverseDistance
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
        pressureX -= 2 * dx * breeze.inverseX * inverseWorldScale * force
        pressureZ -= 2 * dy * breeze.inverseY * inverseWorldScale * force
      }
      const gust = 0.75 + 0.25 * windSine + pressure * 0.45
      const windX = 0.07 * windCosine + pressureX * 0.45
      const windZ = 0.045 * windCosine + pressureZ * 0.45
      let slopeX = derivative * radialX, slopeZ = derivative * radialZ
      for (let w = 0; w < WAVES.length; w++) {
        const wave = WAVES[w], slot = i * WAVES.length + w
        const sine = this.spatialSine[slot] * this.timeCosine[w] - this.spatialCosine[slot] * this.timeSine[w]
        const cosine = this.spatialCosine[slot] * this.timeCosine[w] + this.spatialSine[slot] * this.timeSine[w]
        const shape = sine + 0.28 * sine * cosine
        const derivative = cosine + 0.28 * (2 * cosine * cosine - 1)
        const envelope = w < 3 ? 1 : gust
        const weight = this.sampleWeight[w]
        slopeX += wave.dx * derivative * envelope * weight
        slopeZ += wave.dz * derivative * envelope * weight
        if (w >= 3) {
          // Include envelope derivatives so wind and reflected light agree.
          slopeX += wave.amplitude * shape * windX * weight
          slopeZ += wave.amplitude * shape * windZ * weight
        }
      }
      const ny = 1 / Math.sqrt(1 + slopeX * slopeX + slopeZ * slopeZ)
      const grazing = 1 - ny, grazing2 = grazing * grazing
      const fresnel = 0.02 + 0.98 * grazing2 * grazing2 * grazing
      const reflectedY = 2 * ny * ny - 1
      const skyAngle = (reflectedY - 0.86) / 0.23
      const environment = 0.045 + 0.14 * Math.exp(-skyAngle * skyAngle)
      const reflectionX = (slopeX + REFLECTION_X) / 0.24
      const reflectionZ = (slopeZ + REFLECTION_Z) / 0.09
      const glint = Math.exp(-reflectionX * reflectionX - reflectionZ * reflectionZ)
      const radiance = (1 - fresnel) * 0.026 + fresnel * environment + (0.095 + fresnel * 0.5) * glint * 1.8
      const target = clamp(1 - Math.exp(-radiance * 2.8) + crest * impactStrength * 0.3)
      const luminance = this.luminance[i] + (target - this.luminance[i]) * blend
      this.luminance[i] = luminance
      const visibility = clamp((luminance - 0.055) / 0.12)
      const tone = Math.min(this.shades.length - 1, Math.floor(luminance * this.shades.length))
      const glyph = this.shades[tone]
      const displacement = height * inverseWorldScale * 0.35
      this.glyph(
        glyph,
        this.x[i] + radialX * displacement,
        this.y[i] + radialZ * displacement,
        (0.14 + luminance * 0.8) * visibility * reveal,
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
      this.glyph(age < 0.18 ? 10 : 1, x, y, fade * (0.4 + noise(i, 3) * 0.5))
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
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, this.width, this.height)
    if (this.elapsed < DROP_TIME) {
      this.setState('falling')
      this.drawDrop()
    } else {
      const age = this.elapsed - DROP_TIME
      this.setState(this.motion.matches ? 'still' : age < REVEAL_TIME ? 'ripple' : 'flowing')
      // Constant-speed propagation carries the crest beyond the viewport corners.
      const radius = this.reach * Math.min(age / REVEAL_TIME, 1.25)
      this.atmosphere.update(age - REVEAL_TIME, this.width, this.height, !this.motion.matches)
      this.drawWater(age, radius)
      this.drawSplash(age)
      this.atmosphere.draw(ctx)
    }
    ctx.globalAlpha = 1
  }

  private frame = (now: number): void => {
    this.raf = 0
    if (this.destroyed || document.hidden) return
    if (this.motion.matches) return this.motionChange()
    if (this.last) this.elapsed += Math.min(0.05, (now - this.last) / 1000)
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
    if (this.started && !this.destroyed && !this.raf && !document.hidden && !this.motion.matches) {
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  private visibility = (): void => {
    if (document.hidden) this.stop()
    else this.resume()
  }

  private motionChange = (): void => {
    if (!this.started) return
    this.stop()
    this.elapsed = DROP_TIME + REVEAL_TIME + 4
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
    this.setState('waiting')
  }
}
