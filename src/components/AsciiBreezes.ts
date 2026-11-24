import { sceneScale, SEA_TILT } from './AsciiPerspective'

export type BreezeField = {
  x: number
  y: number
  radiusX: number
  radiusY: number
  inverseX: number
  inverseY: number
  strength: number
}

const FIRST_BREEZE = 0.8
const BREEZE_DURATION = 12
const BREEZE_PERIOD = 1.25
const SLOT_COUNT = Math.ceil(BREEZE_DURATION / BREEZE_PERIOD)
const MAX_GLYPHS = 96

function cohortSeed(birth: number, salt: number): number {
  const value = Math.sin(birth * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

/** Slow overlapping ASCII filaments and their water pressure, on the shared clock. */
export class AsciiBreezes {
  readonly fields: readonly BreezeField[] = Array.from({ length: SLOT_COUNT }, () => ({
    x: 0, y: 0, radiusX: 1, radiusY: 1, inverseX: 1, inverseY: 1, strength: 0,
  }))
  private count = 0
  private readonly x = new Float32Array(MAX_GLYPHS * SLOT_COUNT)
  private readonly y = new Float32Array(MAX_GLYPHS * SLOT_COUNT)
  private readonly alpha = new Float32Array(MAX_GLYPHS * SLOT_COUNT)
  private readonly scale = new Float32Array(MAX_GLYPHS * SLOT_COUNT)

  /** Seconds since the complete water reveal; each passage stays stable on resize. */
  update(time: number, width: number, height: number, enabled: boolean): void {
    this.count = 0
    for (let index = 0; index < SLOT_COUNT; index++) this.fields[index].strength = 0
    if (!enabled || !Number.isFinite(time) || time < FIRST_BREEZE) return
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return

    const newest = Math.floor((time - FIRST_BREEZE) / BREEZE_PERIOD)
    for (let offset = 0; offset < SLOT_COUNT; offset++) {
      const birth = newest - offset
      if (birth < 0) break
      const age = time - (FIRST_BREEZE + birth * BREEZE_PERIOD)
      if (age >= BREEZE_DURATION) continue
      this.buildPassage(this.fields[birth % SLOT_COUNT], birth, age, width, height)
    }
  }

  private buildPassage(
    field: BreezeField,
    birth: number,
    age: number,
    width: number,
    height: number,
  ): void {
    const progress = age / BREEZE_DURATION
    const fade = Math.max(0, Math.min(1, age / 1.1, (BREEZE_DURATION - age) / 1.5))
    const envelope = fade * fade * (3 - 2 * fade)
    if (envelope === 0) return

    const size = 0.9 + cohortSeed(birth, 3) * 0.2
    const laneY = 0.18 + cohortSeed(birth, 5) * 0.7
    const depth = sceneScale(laneY * height, height)
    const length = Math.max(36, Math.min(560 * size, width * 0.8)) * depth
    const direction = cohortSeed(birth, 4) < 0.5 ? -1 : 1
    const centreX = width / 2 + direction * (progress - 0.5) * (width * depth + length)
    const centreY = height * laneY
      + Math.sin(progress * Math.PI) * height * 0.015 * depth * SEA_TILT
    const flow = age * 0.65 + birth * 1.7
    const opacity = (0.2 + cohortSeed(birth, 8) * 0.18) * (0.8 + depth * 0.2)
    const samples = Math.min(MAX_GLYPHS, Math.max(9, Math.ceil(length / (6.5 * depth))))
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let weightedX = 0
    let weightedY = 0
    let weight = 0

    for (let sample = 0; sample < samples; sample++) {
      const u = sample / (samples - 1)
      const x = centreX + (u - 0.5) * length * direction
      // A shallow travelling bend, without curls, split tails or flickering glyphs.
      const y = centreY + (Math.sin(u * Math.PI * 2 - flow) * 5 * size
        + Math.sin(u * Math.PI + flow * 0.35) * 3 * size) * depth * SEA_TILT
      const alpha = envelope * opacity * (0.12 + Math.sin(u * Math.PI) * 0.88)
      const point = this.count++
      this.x[point] = x
      this.y[point] = y
      this.alpha[point] = alpha
      this.scale[point] = depth
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      weightedX += x * alpha
      weightedY += y * alpha
      weight += alpha
    }

    // Pressure follows the visible stripe, preserving its interaction with the water.
    field.x = weightedX / weight
    field.y = weightedY / weight
    field.radiusX = Math.max(12 * depth, field.x - minX, maxX - field.x) + 7 * depth
    field.radiusY = Math.max(9 * depth * SEA_TILT, field.y - minY, maxY - field.y)
      + 6 * depth * SEA_TILT
    field.inverseX = 1 / (field.radiusX * field.radiusX)
    field.inverseY = 1 / (field.radiusY * field.radiusY)
    field.strength = 0.44 * envelope * depth
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.font = '500 11px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    let previousWidth = 1, previousHeight = 1
    for (let point = 0; point < this.count; point++) {
      const depth = this.scale[point]
      // The path is already foreshortened; keep the ink thick enough to read over the sea.
      const height = Math.max(0.85, depth)
      if (depth !== previousWidth || height !== previousHeight) {
        ctx.scale(depth / previousWidth, height / previousHeight)
        previousWidth = depth
        previousHeight = height
      }
      ctx.globalAlpha = this.alpha[point]
      ctx.fillText('1', this.x[point] / depth, this.y[point] / height)
    }
    ctx.restore()
  }
}
