import type { AsciiSceneCamera } from './AsciiSceneCamera'

// Keep the sea's first six glyph slots stable; the fall adds softer droplets and foam curls.
export const WATER_GLYPHS = " .-~+*:,'`o()|"
const DOT = 1, DASH = 2, TILDE = 3, PLUS = 4
const COLON = 6, COMMA = 7, DROP = 8, MIST = 9, BUBBLE = 10, LEFT = 11, RIGHT = 12
const THREAD = 13
const TAU = Math.PI * 2
const STREAMS = 512
const SPRAY = 224
const APPROACH_TIME = 1.1
const FALL_TIME = 1.8

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

  constructor() {
    for (let i = 0; i < this.streams.length; i++) this.streams[i] = seed(i + 71)
    for (let i = 0; i < this.spray.length; i++) this.spray[i] = seed(i + 5219)
  }

  draw(
    time: number, width: number, height: number, cellWidth: number, cellHeight: number,
    camera: AsciiSceneCamera, plot: Plot,
  ): void {
    const lip = camera.lipY, impact = camera.impactY
    const light = camera.waterLight
    if (lip > height + cellHeight || light <= 0) return
    const fallHeight = impact - lip
    const scale = camera.edgeScale
    const foamDepth = height * 0.075
    const mistHeight = height * 0.16
    const count = Math.min(STREAMS, Math.ceil(width / (cellWidth * 0.75)))
    // Extend the same ballistic path past the visible shaft, keeping the sampling cadence.
    const endless = camera.endless
    const fallTime = endless ? 2.1 * FALL_TIME : FALL_TIME
    const spreadDepth = endless ? 1.65 : 0.8
    const lifetime = APPROACH_TIME + fallTime
    const knots = Math.max(16, Math.ceil(height / cellHeight * lifetime / (APPROACH_TIME + FALL_TIME)))
    const spacing = lifetime / knots
    const span = width + 60

    // One material path crosses a stationary brink, then accelerates under gravity.
    // No animated edge geometry, cross-stream sine bands, or separate rollover particles.
    for (let i = 0; i < count; i++) {
      const slot = i * 6
      const source = (i + this.streams[slot] * 0.85) / count * span - 30
      const along = (source - width * 0.5) / scale
      const edge = lip + (noise(along / 160, 0) - 0.5) * 2 * scale
      const channel = noise(along / 95, 7)
      const entrySpeed = height * (0.25 + channel * 0.08)
      const projectedSpeed = entrySpeed * camera.tilt * scale
      const fallCurve = (fallHeight - projectedSpeed * FALL_TIME) / (FALL_TIME * FALL_TIME)
      const drift = (this.streams[slot + 3] - 0.5) * 23 * scale
      const ink = 0.22 + this.streams[slot + 4] * 0.14
      const phase = this.streams[slot + 5] * lifetime
      for (let j = 0; j < knots; j++) {
        const age = (time + j * spacing + phase) % lifetime - APPROACH_TIME
        const falling = Math.max(0, age)
        const y = edge + projectedSpeed * age + fallCurve * falling * falling
        if (y < -cellHeight || y > height + cellHeight) continue
        const descent = falling / FALL_TIME
        const turn = soft(falling / 0.45)
        // Texture is attached to the emission time, not an oscillating screen-space stripe.
        const emitted = time - age
        const material = noise(along / 48, emitted * 0.7)
        const detail = noise(along / 15 + material * 2, emitted * 1.6)
        const sideways = (material - 0.5) * 12 * scale
        // In the deeper shot the spray disperses over a longer stretch of the shaft.
        const dissipation = soft((descent - 0.2) / spreadDepth)
        const scatter = (detail - 0.5) * 34 * scale * dissipation
        const x = source + sideways * turn + drift * descent * descent + scatter
        if (x < -cellWidth || x > width + cellWidth) continue
        const envelope = soft((age + APPROACH_TIME) / (APPROACH_TIME * 0.6))
          * (1 - soft((falling / fallTime - 0.92) / 0.08))
        const sheen = 1 + 0.65 * Math.exp(-age * age / 0.24)
        // Compensate overlapping samples at the slow brink instead of drawing a bright rim.
        const coverage = Math.min(1, (projectedSpeed + 2 * fallCurve * falling) * spacing / cellHeight)
        const alpha = ink * envelope * sheen * (0.5 + material * 0.5) * (0.7 + detail * 0.3) * coverage
          * (1 - 0.6 * dissipation) * light
        let glyph = detail > 0.6 ? DASH : DOT
        if (age < 0 && material > 0.72) glyph = TILDE
        else if (turn > 0.25 + detail * 0.5) glyph = detail > 0.8 ? THREAD : detail > 0.4 ? COMMA : COLON
        else if (age >= 0) glyph = COMMA
        if (dissipation > 0.55 + detail * 0.4) glyph = detail > 0.7 ? MIST : DOT
        plot(glyph, x, y, alpha)
        // Short, fading trails keep the accelerating water filament-like, not isolated rain.
        if (age > 0.25 && this.streams[slot + 4] > 0.45) {
          for (let k = 1; k <= 2; k++) {
            const trail = age - spacing * k * 0.22
            const trailTurn = soft(trail / 0.45)
            const trailDescent = trail / FALL_TIME
            // Streaks break up as the water dissipates; low in the fall only loose drops remain.
            const trailSpread = 1 - soft((trailDescent - 0.25) / 0.6)
            if (trailSpread <= 0) continue
            plot(
              k === 1 ? COLON : DOT,
              source + sideways * trailTurn + drift * trailDescent * trailDescent + scatter,
              edge + projectedSpeed * trail + fallCurve * trail * trail,
              alpha * trailSpread * (k === 1 ? 0.45 : 0.22),
            )
          }
        }
      }
    }

    if (endless || impact > height + mistHeight) return
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
        // The base reads as diffuse mist, softer than the water at the brink.
        let alpha = core * (0.11 + cloud * 0.18) + haze * cloud * 0.13
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
      plot(phase < 0.45 ? DROP : COMMA, x, y, alpha)
      if (phase < 0.6 && this.spray[slot + 5] > 0.65) {
        const trail = Math.max(0, phase - 0.035)
        plot(DOT, origin + side * trail, impact - 4 * lift * trail * (1 - trail), alpha * 0.45)
      }
      const rise = (phase + 0.45) % 1
      const mistX = origin + Math.sin(rise * 3 + this.spray[slot + 3] * TAU) * 14 + side * rise * 0.4
      plot(MIST, mistX, impact - rise * mistHeight, Math.sin(rise * Math.PI) * 0.075)
    }
  }
}
