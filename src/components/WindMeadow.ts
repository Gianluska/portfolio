import { grain, HORIZON, smooth } from './DawnLandscape'

const BANDS = [0, 0.16, 0.31, 0.47, 0.65, 0.83, 1.12]
const BLADE_COLORS = ['#050505', '#777', '#ddd']

interface Stem {
  x: number
  y: number
  length: number
  width: number
  lean: number
  flex: number
  waveSin: number
  waveCos: number
  gustSin: number
  gustCos: number
  plume: number
  bend: number
}

interface Band {
  blades: Stem[][]
  plumes: Stem[]
}

/** Draw the tapered leaf with its root fixed and most of the bend above the midpoint. */
function leaf(ctx: CanvasRenderingContext2D, stem: Stem, bend: number): void {
  const { x, y, width, length } = stem
  const tip = y - length + Math.abs(bend) * 0.22
  ctx.moveTo(x - width * 0.52, y)
  ctx.quadraticCurveTo(x + bend * 0.07 - width * 0.55, tip + length * 0.33, x + bend, tip)
  ctx.quadraticCurveTo(x + bend * 0.15 + width * 0.62, tip + length * 0.41, x + width * 0.48, y)
  ctx.closePath()
}

/** Feathered panicle: alternating tips along the spine, not an oval placed on a stick. */
function seedHead(ctx: CanvasRenderingContext2D, stem: Stem, bend: number): void {
  const { x, y, length, plume } = stem
  const tipX = x + bend
  const tipY = y - length + Math.abs(bend) * 0.22
  const dx = plume * (0.23 + bend / length * 0.50)
  const dy = -plume * 0.92
  for (let side = -1; side <= 1; side += 2) {
    ctx.moveTo(tipX, tipY + plume * 0.10)
    for (let rung = 1; rung <= 6; rung++) {
      const t = rung / 7
      const spread = plume * (0.105 + t * 0.075) * (1.12 - t)
      const sx = tipX + dx * t, sy = tipY + dy * t
      ctx.lineTo(sx + side * spread * 0.29, sy + plume * 0.04)
      ctx.lineTo(sx + side * spread + dx * 0.20, sy + dy * 0.24)
    }
    ctx.lineTo(tipX + dx * 1.08, tipY + dy * 1.05)
    ctx.closePath()
  }
}

/** Perspective clumps, three blade tones per depth band, and coherent traveling gusts. */
export class WindMeadow {
  private readonly bands: Band[] = []
  private width = 0
  private height = 0

  resize(width: number, height: number): number {
    this.width = width
    this.height = height
    this.bands.length = 0
    const scale = Math.min(height, width * 1.8)
    const density = Math.min(390, Math.max(95, Math.round(width * 0.27)))
    // Include the highest possible blade tips and airborne seeds at any wind phase.
    let upperEdge = height * (HORIZON - 0.085) - 6
    for (let bandIndex = 0; bandIndex < BANDS.length - 1; bandIndex++) {
      const band: Band = { blades: [[], [], []], plumes: [] }
      this.bands.push(band)
      const count = Math.round(density * (1.10 - bandIndex * 0.083))
      const clumps = Math.max(8, Math.round(count / 7))
      for (let j = 0; j < count; j++) {
        const id = bandIndex * 1024 + j
        const tuft = Math.floor(j / 7)
        const baseX = (tuft + grain(tuft + bandIndex * 79, 2) * 0.8) / clumps
        const far = BANDS[bandIndex], near = BANDS[bandIndex + 1]
        const depth = far + (near - far) * (0.12 + 0.76 * grain(tuft + bandIndex * 79, 4))
        const d = Math.min(1, depth)
        const x = baseX + (grain(id, 7) - 0.5) * (0.035 + d * 0.14)
        const root = HORIZON + (1.015 - HORIZON) * depth ** 1.43
          + (grain(id, 8) - 0.5) * (0.002 + d * 0.019)
        const vigor = grain(id, 14)
        const length = Math.min((root - HORIZON) * height * 0.84,
          scale * (0.0035 + d ** 1.52 * 0.078) * (0.45 + vigor * 0.73))
        if (length < 0.4) continue
        const leafWidth = 0.62 + d ** 1.35 * scale * (0.0014 + grain(id, 15) * 0.0039)
        const phase = x * 13.4 + depth * 8.2
        const gust = x * 5.8 - depth * 6.7 + (grain(tuft, bandIndex + 30) - 0.5) * 0.5
        const stem: Stem = {
          x: x * width, y: root * height, length, width: leafWidth,
          lean: (grain(id, 16) - 0.47) * 0.71,
          flex: 0.64 + grain(id, 17) * 0.57,
          waveSin: Math.sin(phase), waveCos: Math.cos(phase),
          gustSin: Math.sin(gust), gustCos: Math.cos(gust),
          plume: 0,
          bend: 0,
        }
        const brightness = grain(id, 19)
        const hasPlume = brightness > 0.84 - 0.05 * d && (vigor > 0.48 || bandIndex === 0)
        if (hasPlume) {
          stem.width *= 0.42
          stem.plume = Math.min((root - HORIZON) * height * 0.12, 1.6 + length * (0.17 + grain(id, 20) * 0.13))
          band.plumes.push(stem)
        }
        upperEdge = Math.min(upperEdge, stem.y - stem.length - stem.plume * 1.12)
        band.blades[brightness < 0.38 ? 0 : brightness < 0.78 ? 1 : 2].push(stem)
      }
    }
    return upperEdge
  }

  draw(ctx: CanvasRenderingContext2D, time: number, elevation: number): void {
    if (elevation <= 0.07) return
    const broadSin = Math.sin(time * 1.08), broadCos = Math.cos(time * 1.08)
    const gustSin = Math.sin(time * 1.84), gustCos = Math.cos(time * 1.84)
    for (let i = 0; i < this.bands.length; i++) {
      const band = this.bands[i]
      const depth = i / (this.bands.length - 1)
      // The front of light reaches the horizon clumps first, then the foreground.
      const delay = 0.07 + 0.34 * depth
      const light = smooth((elevation - delay) / (0.96 - delay))
      if (light === 0) continue
      for (let tone = 0; tone < BLADE_COLORS.length; tone++) {
        ctx.fillStyle = BLADE_COLORS[tone]
        ctx.globalAlpha = light * (tone === 0 ? 1 : tone === 1 ? 0.68 : 0.83)
        ctx.beginPath()
        for (const stem of band.blades[tone]) {
          const wave = stem.waveSin * broadCos - stem.waveCos * broadSin
          const gust = Math.max(0, stem.gustSin * gustCos - stem.gustCos * gustSin)
          stem.bend = stem.length * (stem.lean + stem.flex * (0.25 + 0.18 * wave + 0.53 * gust * gust))
          leaf(ctx, stem, stem.bend)
        }
        ctx.fill()
      }
      ctx.globalAlpha = light * (0.95 - 0.08 * depth)
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      for (const stem of band.plumes) seedHead(ctx, stem, stem.bend)
      ctx.fill()
    }
    this.chaff(ctx, time, smooth((elevation - 0.35) / 0.62))
    ctx.globalAlpha = 1
  }

  private chaff(ctx: CanvasRenderingContext2D, time: number, light: number): void {
    if (light < 0.45) return
    const { width, height } = this
    ctx.fillStyle = '#ddd'
    for (let i = 0; i < 24; i++) {
      const life = 6 + grain(i, 84) * 6
      const age = (time / life + grain(i, 22)) % 1
      const x = ((grain(i, 83) + time * (0.014 + grain(i, 60) * 0.026)) % 1) * width
      const y = height * (HORIZON - 0.03 + grain(i, 45) * 0.29 - age * 0.055) + Math.sin(time * 1.4 + i) * 6
      ctx.globalAlpha = 0.46 * light * smooth(age * 8) * smooth((1 - age) * 7)
      ctx.fillRect(x, y, 1.1 + grain(i, 78) * 1.6, 1)
    }
  }
}
