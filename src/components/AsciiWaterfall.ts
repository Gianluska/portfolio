import type { AsciiSceneCamera } from './AsciiSceneCamera'

// Keep the sea's first six glyph slots stable; the fall adds softer droplets and foam curls.
export const WATER_GLYPHS = " .-~+*:,'`o()|"
const DOT = 1, DASH = 2, TILDE = 3, PLUS = 4
const COLON = 6, COMMA = 7, DROP = 8, MIST = 9, BUBBLE = 10, LEFT = 11, RIGHT = 12
const THREAD = 13
const TAU = Math.PI * 2
const STREAMS = 512
const SPRAY = 224

type Plot = (glyph: number, x: number, y: number, alpha: number) => void
const clamp = (value: number): number => Math.max(0, Math.min(1, value))

function seed(index: number): number {
  let hash = Math.imul(index + 1, 374761393)
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const dx = x - ix, dy = y - iy
  const sx = dx * dx * (3 - 2 * dx), sy = dy * dy * (3 - 2 * dy)
  const a = seed(ix + Math.imul(iy, 15731)), b = seed(ix + 1 + Math.imul(iy, 15731))
  const c = seed(ix + Math.imul(iy + 1, 15731)), d = seed(ix + 1 + Math.imul(iy + 1, 15731))
  return a + (b - a) * sx + (c - a + (a - b - c + d) * sx) * sy
}

function soft(value: number): number {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}

/** Advected water filaments and aerated, curling whitewater share the river's glyph buffer. */
export class AsciiWaterfall {
  private readonly streams = new Float32Array(STREAMS * 6)
  private readonly spray = new Float32Array(SPRAY * 6)
  private pointerX = Number.NaN
  private pointerY = 0
  private pressure = 0
  private dragX = 0
  private dragY = 0
  private lastTime = Number.NaN
  private radius = 130
  private inverseRadius = 1 / (130 * 130)

  constructor() {
    for (let i = 0; i < this.streams.length; i++) this.streams[i] = seed(i + 71)
    for (let i = 0; i < this.spray.length; i++) this.spray[i] = seed(i + 5219)
  }

  private updatePointer(time: number, width: number, visible: boolean, x: number, y: number): void {
    const delta = Number.isFinite(this.lastTime) ? Math.max(0, Math.min(0.05, time - this.lastTime)) : 0
    if (!visible || time < this.lastTime) {
      this.pressure = 0
      this.pointerX = Number.NaN
      this.dragX = this.dragY = 0
    }
    this.lastTime = time
    if (!visible) return
    this.radius = Math.min(130, width * 0.22)
    this.inverseRadius = 1 / (this.radius * this.radius)
    const active = Number.isFinite(x) && Number.isFinite(y)
    const blend = -Math.expm1(-12 * delta)
    if (active && !Number.isFinite(this.pointerX)) {
      this.pointerX = x
      this.pointerY = y
    }
    const dx = active ? x - this.pointerX : 0, dy = active ? y - this.pointerY : 0
    this.dragX += (Math.max(-14, Math.min(14, dx * 0.4)) - this.dragX) * blend
    this.dragY += (Math.max(-14, Math.min(14, dy * 0.4)) - this.dragY) * blend
    if (active) {
      this.pointerX += dx * blend
      this.pointerY += dy * blend
    }
    this.pressure += ((active ? 1 : 0) - this.pressure) * -Math.expm1(-9 * delta)
    if (!active && this.pressure < 0.001) {
      this.pressure = 0
      this.pointerX = Number.NaN
    }
  }

  private plotDrop(plot: Plot, glyph: number, x: number, y: number, alpha: number): void {
    if (alpha < 0.025) return
    if (this.pressure > 0) {
      const dx = x - this.pointerX, dy = y - this.pointerY
      if (Math.abs(dx) < this.radius && Math.abs(dy) < this.radius) {
        const distance = (dx * dx + dy * dy) * this.inverseRadius
        if (distance < 1) {
          const weight = this.pressure * (1 - distance) ** 2
          const normal = 1 / Math.sqrt(dx * dx + dy * dy + 36)
          x += (dx * normal * 30 + this.dragX) * weight
          y += (dy * normal * 14 + this.dragY * 0.5) * weight
        }
      }
    }
    plot(glyph, x, y, alpha)
  }

  draw(
    time: number, width: number, height: number, cellWidth: number, cellHeight: number,
    camera: AsciiSceneCamera, plot: Plot, pointerX = Number.NaN, pointerY = Number.NaN,
  ): void {
    const lip = camera.lipY, impact = camera.impactY
    this.updatePointer(time, width, lip <= height + cellHeight, pointerX, pointerY)
    if (lip > height + cellHeight) return
    const fallHeight = impact - lip
    const scale = camera.edgeScale
    const foamDepth = height * 0.075
    const mistHeight = height * 0.16
    const count = Math.min(STREAMS, Math.ceil(width / 4.5))
    const knots = Math.max(8, Math.ceil(fallHeight / (cellHeight * 1.8)))
    const span = width + 60

    // Material points move down curved streamlines, instead of lighting a fixed vertical grid.
    for (let i = 0; i < count; i++) {
      const slot = i * 6
      const source = (i + this.streams[slot] * 0.85) / count * span - 30
      const phase = this.streams[slot + 1] * TAU
      const speed = 0.12 + this.streams[slot + 2] * 0.055
      const drift = (this.streams[slot + 3] - 0.5) * 23 * scale
      const bend = Math.sin(time * 0.22 + phase) * 0.8
      const volume = 0.45 + 0.55 * noise(source / 180, time * 0.045)
      const ink = (0.14 + this.streams[slot + 4] * 0.13) * volume
      const edge = lip + Math.sin(source * 0.025) * 1.5 * scale
      if (i % 3 === 0) plot(DASH, source, edge, 0.075 * volume)
      for (let j = 0; j < knots; j++) {
        const u = (j / knots + time * speed + this.streams[slot + 5]) % 1
        const v = 0.34 * u + 0.66 * u * u
        const turn = Math.sin(v * 7.5 + phase + bend)
        const x = source + turn * (2 + v * 9) * scale + drift * v * v
        const y = edge + v * fallHeight
        if (x < -cellWidth || x > width + cellWidth || y < 0 || y > height + cellHeight) continue
        const envelope = soft(v / 0.06) * (1 - soft((v - 0.94) / 0.06))
        const gleam = 0.65 + this.streams[(slot + j) % this.streams.length] * 0.35
        const alpha = ink * envelope * gleam
        const glyph = j % 7 === 0 ? THREAD : j % 5 === 0 ? DROP : j % 3 === 0 ? COMMA : COLON
        this.plotDrop(plot, glyph, x, y, alpha)
        // Short, translucent companion marks give each wisp thickness without a solid stripe.
        if (this.streams[slot + 4] > 0.55) {
          this.plotDrop(plot, DOT, x + turn * 2.5, y - cellHeight * 0.7, alpha * 0.55)
        }
      }
    }

    if (impact > height + mistHeight) return
    const stepX = cellWidth * 0.9, stepY = cellHeight * 0.67
    const top = Math.max(lip, impact - mistHeight)
    const rows = Math.ceil((height - top) / stepY)
    const cols = Math.ceil(width / stepX) + 1

    // A continuous, rounded density field replaces the old hard-edged, sawtooth foam boundary.
    for (let row = 0; row < rows; row++) {
      const y = top + (row + 0.5) * stepY
      const relative = (y - impact) / foamDepth
      const above = Math.max(0, -relative)
      const haze = Math.exp(-above * above * 0.65) * (1 - soft((relative - 0.1) / 1.9))
      const pool = soft(relative / 0.45) * Math.exp(-Math.max(0, relative) * 0.65)
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5 + (row % 2) * 0.4) * stepX
        const nx = x / (62 * Math.max(0.7, scale))
        const curl = noise(nx * 0.48 + time * 0.055, relative * 0.65 - time * 0.12)
        const curved = relative + (curl - 0.5) * 0.7
        const core = Math.exp(-curved * curved * 2.7)
        const billow = noise(nx + curl * 1.8 - time * 0.16, relative * 1.25 + curl - time * 0.2)
        const detail = noise(nx * 3.4 + time * 0.12, relative * 3.5 - time * 0.6)
        const cloud = soft((billow - 0.18) / 0.64)
        const edge = Math.max(0, 1 - Math.abs(billow - 0.53) * 7)
        let alpha = core * (0.19 + cloud * 0.31) + haze * cloud * 0.15
        const grain = this.spray[(row * 7 + col * 13) % this.spray.length]
        let glyph = grain > 0.94 ? PLUS : grain > 0.68 ? COMMA : grain > 0.28 ? COLON : DOT
        if (edge > 0.7 && detail > 0.55 && core > 0.4 && grain > 0.94) {
          glyph = grain > 0.985 ? BUBBLE : curl > 0.52 ? RIGHT : LEFT
          alpha += core * edge * 0.05
        }
        // Smooth outward ripples under the impact retain dark gaps between their crests.
        if (relative > 0.35) {
          const ripple = Math.sin(relative * 9 - time * 1.5 + curl * 5 + billow * 2)
          alpha = alpha * (1 - pool * 0.8) + pool * soft((ripple - 0.2) / 0.8) * 0.15
          alpha *= 0.45 + detail * 0.55
          glyph = ripple > 0.6 && grain > 0.3 ? TILDE : grain > 0.7 ? DASH : DOT
        }
        if (alpha < 0.027) continue
        const offset = (detail - 0.5) * stepY * 0.5
        plot(glyph, x + (curl - 0.5) * stepX * 0.7, y + offset, alpha)
      }
    }

    // Layered ballistic spray: a bright launch, fine falling beads, then a faint rising drift.
    const sprayCount = width < 640 ? 84 : SPRAY
    for (let i = 0; i < sprayCount; i++) {
      const slot = i * 6
      const phase = (time / (1.8 + this.spray[slot + 1] * 2.2) + this.spray[slot + 2]) % 1
      const origin = (i + this.spray[slot]) / sprayCount * span - 30
      const lift = height * (0.018 + this.spray[slot + 3] ** 2 * 0.085)
      const side = (this.spray[slot + 4] - 0.5) * height * 0.1
      const x = origin + side * phase
      const y = impact - 4 * lift * phase * (1 - phase)
      const fade = Math.sin(phase * Math.PI)
      const alpha = fade * (0.14 + this.spray[slot + 5] * 0.27)
      this.plotDrop(plot, phase < 0.45 ? DROP : COMMA, x, y, alpha)
      if (phase < 0.6 && this.spray[slot + 5] > 0.65) {
        const trail = Math.max(0, phase - 0.035)
        this.plotDrop(plot, DOT, origin + side * trail, impact - 4 * lift * trail * (1 - trail), alpha * 0.45)
      }
      const rise = (phase + 0.45) % 1
      const mistX = origin + Math.sin(rise * 3 + this.spray[slot + 3] * TAU) * 14 + side * rise * 0.4
      this.plotDrop(plot, MIST, mistX, impact - rise * mistHeight, Math.sin(rise * Math.PI) * 0.075)
    }
  }
}
