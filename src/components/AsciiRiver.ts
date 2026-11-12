const TAU = Math.PI * 2
const DROP_TIME = 0.95
const REVEAL_TIME = 1.85
const FRAME_TIME = 1000 / 30
const GLYPHS = ' .,:~=-/\\|+*'
const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value))

function noise(x: number, y: number): number {
  let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295
}

function lineGlyph(dx: number, dy: number): number {
  const angle = ((Math.atan2(dy, dx) + Math.PI) % Math.PI) / Math.PI
  return angle < 0.125 || angle >= 0.875 ? 6 : angle < 0.375 ? 8 : angle < 0.625 ? 9 : 7
}

type RiverState = 'waiting' | 'falling' | 'ripple' | 'flowing' | 'still'

/** A small falling drop opens a procedural river; only glyphs are painted. */
export class AsciiRiver {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly atlas = document.createElement('canvas')
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer: ResizeObserver
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
  private waterCount = 0
  private x!: Float32Array
  private y!: Float32Array
  private distance!: Float32Array
  private across!: Float32Array
  private grain!: Float32Array
  private direction!: Uint8Array
  private radial!: Uint8Array
  private water!: Uint32Array

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
    this.x = new Float32Array(this.count)
    this.y = new Float32Array(this.count)
    this.distance = new Float32Array(this.count)
    this.across = new Float32Array(this.count)
    this.grain = new Float32Array(this.count)
    this.direction = new Uint8Array(this.count)
    this.radial = new Uint8Array(this.count)
    this.water = new Uint32Array(this.count)
    this.waterCount = 0
    const breadth = Math.min(this.width * 0.3, this.height * 0.29)
    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * this.cellHeight
      const v = y / this.height - 0.5
      const centre = this.width * (0.5 + Math.sin(v * 5.8) * 0.14 + Math.sin(v * 13) * 0.025)
      const slope = this.width / this.height * (Math.cos(v * 5.8) * 0.812 + Math.cos(v * 13) * 0.325)
      const halfWidth = breadth * (0.88 + 0.14 * Math.sin(v * 5 + 1) + 0.13 * (v + 0.5))
      const bank = Math.sin(y * 0.019) * 0.018 + Math.sin(y * 0.057) * 0.008
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col
        const x = (col + 0.5) * this.cellWidth
        this.x[i] = x
        this.y[i] = y
        this.distance[i] = Math.hypot(x - this.width / 2, y - this.height / 2)
        this.across[i] = (x - centre) / halfWidth + bank
        this.grain[i] = noise(col, row)
        this.direction[i] = lineGlyph(slope, 1)
        this.radial[i] = lineGlyph(-(y - this.height / 2), x - this.width / 2)
        if (Math.abs(this.across[i]) < 1.025) this.water[this.waterCount++] = i
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
    for (let k = 0; k < this.waterCount; k++) {
      const i = this.water[k]
      const reveal = clamp((radius - this.distance[i]) / 48)
      const top = clamp((this.y[i] - 72) / 110)
      if (!reveal || !top) continue
      const u = this.across[i]
      const depth = Math.max(0, 1 - Math.abs(u))
      // Advection carries the same features downstream instead of scrambling the grid.
      const travel = this.y[i] * 0.052 - age * (2.2 + depth * 1.15)
      const wave = 0.5 + 0.5 * Math.sin(travel + Math.sin(u * 10) * 1.8)
      const crest = wave * wave * wave * wave * wave * wave
      const strand = 0.5 + 0.5 * Math.sin(u * 34 + Math.sin(travel * 0.19 - age * 0.16) * 2.1)
      const thread = strand * strand * strand * strand * strand * strand
      const foam = Math.exp(-depth * 45) * (0.4 + 0.6 * Math.sin(travel * 0.8 + u * 4) ** 2)
      const eddy = Math.sin(u * 17 - travel * 0.37) * Math.sin(travel * 0.41 + u * 7)
      let light = 0.085 + thread * 0.32 + crest * 0.3 + foam * 0.55 + eddy * 0.04
      light *= 0.65 + this.grain[i] * 0.45
      let glyph = this.direction[i]
      if (depth < 0.055) glyph = this.grain[i] > 0.6 ? 3 : 1
      else if (crest > 0.65) glyph = thread > 0.6 ? 5 : 4
      else if (thread < 0.25) glyph = this.grain[i] > 0.7 ? 2 : 1
      else if (this.grain[i] > 0.85) glyph = 3
      this.glyph(glyph, this.x[i], this.y[i], light * reveal * top)
    }
  }

  private drawWave(age: number, radius: number): void {
    if (age >= REVEAL_TIME) return
    const fade = 1 - age / REVEAL_TIME * 0.45
    for (let i = 0; i < this.count; i++) {
      const band = Math.abs(this.distance[i] - radius)
      if (band > 16 || this.grain[i] < 0.22) continue
      const alpha = (1 - band / 16) * fade * 0.64 * clamp((this.y[i] - 72) / 70)
      this.glyph(this.radial[i], this.x[i], this.y[i], alpha)
    }
    // A quieter echo follows the leading edge, not another reveal.
    const echo = radius - 38
    if (echo > 0) {
      for (let i = 0; i < this.count; i++) {
        const band = Math.abs(this.distance[i] - echo)
        if (band < 9 && this.grain[i] > 0.5) {
          this.glyph(1, this.x[i], this.y[i], (1 - band / 9) * fade * 0.2)
        }
      }
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
      const radius = this.reach * clamp(age / REVEAL_TIME)
      this.drawWater(age, radius)
      this.drawWave(age, radius)
      this.drawSplash(age)
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
