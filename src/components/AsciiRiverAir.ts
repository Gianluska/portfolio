import { sceneScale, SEA_TILT } from './AsciiPerspective'
import type { AsciiSceneCamera } from './AsciiSceneCamera'

const INSECTS = 8
const DUST = 32
const MIST_BANKS = 3
const MIST_COLUMNS = 56
const MIST_ROWS = 7
const MIST_POINTS = MIST_BANKS * MIST_COLUMNS * MIST_ROWS
const FOG_OPACITY = 0.3
const FOG_LEAD = 2

function seed(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function fade(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

/** Airborne details on the water's clock; fixed buffers, no extra animation loop. */
export class AsciiRiverAir {
  private time = 0
  private insectCount = 0
  private dustCount = 0
  private mistCount = 0
  private readonly insectX = new Float32Array(INSECTS)
  private readonly insectY = new Float32Array(INSECTS)
  private readonly insectAlpha = new Float32Array(INSECTS)
  private readonly insectScale = new Float32Array(INSECTS)
  private readonly dustX = new Float32Array(DUST)
  private readonly dustY = new Float32Array(DUST)
  private readonly dustAlpha = new Float32Array(DUST)
  private readonly dustScale = new Float32Array(DUST)
  private readonly mistX = new Float32Array(MIST_POINTS)
  private readonly mistY = new Float32Array(MIST_POINTS)
  private readonly mistAlpha = new Float32Array(MIST_POINTS)
  private readonly mistGlyph = new Uint8Array(MIST_POINTS)
  private readonly mistScale = new Float32Array(MIST_POINTS)
  private readonly mistTexture = Float32Array.from({ length: MIST_POINTS }, (_, i) => seed(i, 19))
  private readonly veil = document.createElement('canvas')
  private readonly depthVeil = document.createElement('canvas')
  private fogWidth = 0
  private fogHeight = 0
  private fogAlpha = 0
  private readonly banks = Array.from({ length: MIST_BANKS }, () => ({
    x: 0, y: 0, radiusX: 0, radiusY: 0, alpha: 0,
  }))
  private bankCount = 0

  constructor() {
    // Cache both scattering textures once; frames only move and composite small atlases.
    this.depthVeil.width = 4
    this.depthVeil.height = 256
    const depth = this.depthVeil.getContext('2d')!
    const haze = depth.createLinearGradient(0, 0, 0, 256)
    haze.addColorStop(0, 'rgba(255,255,255,0.18)')
    haze.addColorStop(0.18, 'rgba(255,255,255,0.15)')
    haze.addColorStop(0.4, 'rgba(255,255,255,0.09)')
    haze.addColorStop(0.65, 'rgba(255,255,255,0.035)')
    haze.addColorStop(0.9, 'rgba(255,255,255,0)')
    haze.addColorStop(1, 'rgba(255,255,255,0)')
    depth.fillStyle = haze
    depth.fillRect(0, 0, 4, 256)
    this.veil.width = 256
    this.veil.height = 96
    const ctx = this.veil.getContext('2d')
    if (!ctx) throw new Error('The river mist requires a 2D canvas context')
    for (let lobe = 0; lobe < 3; lobe++) {
      ctx.save()
      ctx.translate(65 + lobe * 63, 48 + (lobe === 1 ? -8 : 6))
      ctx.scale(65 + (lobe === 1 ? 15 : 0), 30)
      const scatter = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
      scatter.addColorStop(0, 'rgba(255,255,255,0.85)')
      scatter.addColorStop(0.45, 'rgba(255,255,255,0.6)')
      scatter.addColorStop(0.78, 'rgba(255,255,255,0.16)')
      scatter.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = scatter
      ctx.fillRect(-1, -1, 2, 2)
      ctx.restore()
    }
  }

  update(time: number, width: number, height: number, enabled: boolean): void {
    this.insectCount = 0
    this.dustCount = 0
    this.mistCount = 0
    this.bankCount = 0
    this.fogAlpha = 0
    if (!enabled || !Number.isFinite(time) || time <= -FOG_LEAD || width <= 0 || height <= 0) return
    this.time = time
    const entrance = fade(time / 2)
    const fogTime = time + FOG_LEAD
    const fogEntrance = fade(fogTime / 2)
    this.fogWidth = width
    this.fogHeight = height
    this.fogAlpha = fogEntrance
    const area = width * height
    const insectDensity = Math.min(INSECTS, Math.max(3, area / 150000))
    const dustDensity = Math.min(DUST, Math.max(12, area / 40000))
    this.insectCount = time > 0 ? Math.ceil(insectDensity) : 0
    this.dustCount = time > 0 ? Math.ceil(dustDensity) : 0

    for (let i = 0; i < this.insectCount; i++) {
      const life = 20 + i * 1.7
      const flight = time + i * 4.3
      const birth = Math.floor(flight / life)
      const age = flight - birth * life
      const identity = birth * INSECTS + i
      const anchorX = width * (0.12 + seed(identity, 2) * 0.76)
      const anchorY = height * (0.19 + seed(identity, 3) * 0.7)
      const depth = sceneScale(anchorY, height)
      const phase = age * (1.2 + seed(identity, 1) * 0.6) * depth + i * 2.1
      // Stable reference depth shrinks and slows the entire loitering flight.
      this.insectX[i] = anchorX
        + (Math.sin(phase) * 23 + Math.sin(phase * 2.3) * 5 + age * 0.8) * depth
      this.insectY[i] = anchorY + (Math.cos(phase * 0.83) * 14 + Math.sin(phase * 1.7) * 5) * depth
      this.insectScale[i] = depth
      this.insectAlpha[i] = entrance * fade(age / 1.2) * fade((life - age) / 1.5)
        * (0.36 + seed(identity, 4) * 0.16) * depth * Math.min(1, insectDensity - i)
    }

    for (let i = 0; i < this.dustCount; i++) {
      const life = 18 + seed(i, 5) * 12
      const progress = (time / life + seed(i, 6)) % 1
      const anchorY = height * (0.18 + seed(i, 8) * 0.72)
      const depth = sceneScale(anchorY, height)
      const phase = time * 0.35 * depth + i * 2.4
      this.dustX[i] = width * seed(i, 7) + (progress * 65 + Math.sin(phase) * 10) * depth
      this.dustY[i] = anchorY - (progress * 65 - Math.cos(phase * 0.7) * 5) * depth
      this.dustScale[i] = depth
      this.dustAlpha[i] = entrance * fade(progress / 0.12) * fade((1 - progress) / 0.18)
        * (0.14 + seed(i, 9) * 0.18) * depth * Math.min(1, dustDensity - i)
    }

    const bankDensity = 2 + fade((width - 560) / 240)
    const columns = MIST_COLUMNS
    for (let bank = 0; bank < Math.ceil(bankDensity); bank++) {
      const laneY = 0.18 + bank * 0.21
      const depth = sceneScale(laneY * height, height)
      const radiusX = Math.min(820, width * 0.95) * (1.1 - depth * 0.3)
      const bankFade = Math.min(1, bankDensity - bank)
      const travel = width + radiusX * 2
      // Clock phase is viewport-independent, so resizing never restarts a bank.
      const progress = (seed(bank, 10) + fogTime * (7 + bank * 1.5) * depth / 1940) % 1
      const centreX = -radiusX + progress * travel
      const centreY = height * laneY + Math.sin(fogTime * 0.12 * depth + bank) * 12 * depth * SEA_TILT
      const radiusY = height * (0.14 + bank * 0.02) * (0.65 + depth * 0.35) * SEA_TILT
      const veil = this.banks[this.bankCount++]
      veil.x = centreX
      veil.y = centreY
      veil.radiusX = radiusX
      veil.radiusY = radiusY * 1.8
      veil.alpha = fogEntrance * (0.2 + Math.sin(fogTime * 0.14 + bank) * 0.025) * (1.3 - depth * 0.5) * bankFade
      for (let row = 0; row < MIST_ROWS; row++) {
        const v = row / (MIST_ROWS - 1) * 2 - 1
        const vertical = (1 - v * v) ** 2
        if (vertical === 0) continue
        for (let col = 0; col < columns; col++) {
          const u = col / (columns - 1) * 2 - 1
          const texture = this.mistTexture[(bank * MIST_ROWS + row) * MIST_COLUMNS + col]
          if (texture < 0.2) continue
          const alpha = fogEntrance * (1 - u * u) ** 2 * vertical * (0.055 + texture * 0.065)
            * (1.2 - depth * 0.4) * bankFade
          if (alpha < 0.004) continue
          const point = this.mistCount++
          this.mistX[point] = centreX + u * radiusX + (texture - 0.5) * 7 * depth
          this.mistY[point] = centreY + v * radiusY
            + Math.sin(u * 5 - fogTime * 0.18 * depth + bank) * radiusY * 0.28
          this.mistScale[point] = depth
          this.mistAlpha[point] = alpha
          this.mistGlyph[point] = texture < 0.45 ? 0 : texture < 0.75 ? 1 : 2
        }
      }
    }
  }

  /** Depth haze and drifting banks veil the water, wind and ship beneath airborne actors. */
  drawMist(ctx: CanvasRenderingContext2D, camera: AsciiSceneCamera): void {
    if (this.fogAlpha <= 0) return
    ctx.save()
    ctx.globalAlpha = this.fogAlpha * FOG_OPACITY
    // Unproject the screen-wide veil so camera retreat cannot expose its rectangular edges.
    // Local banks below still inherit the actor projection.
    const zoom = camera.zoom, pitch = zoom * camera.tilt / SEA_TILT
    const left = this.fogWidth * (zoom - 1) / (2 * zoom)
    const top = this.fogHeight / 2 - camera.centerY / pitch
    ctx.drawImage(this.depthVeil, left, top, this.fogWidth / zoom, this.fogHeight / pitch)
    ctx.fillStyle = '#ffffff'
    ctx.font = '400 12px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < this.bankCount; i++) {
      const bank = this.banks[i]
      ctx.globalAlpha = bank.alpha * FOG_OPACITY
      ctx.drawImage(this.veil, bank.x - bank.radiusX, bank.y - bank.radiusY,
        bank.radiusX * 2, bank.radiusY * 2)
    }
    let previousScale = 1
    ctx.scale(1, SEA_TILT)
    for (let i = 0; i < this.mistCount; i++) {
      const depth = this.mistScale[i]
      if (depth !== previousScale) {
        ctx.scale(depth / previousScale, depth / previousScale)
        previousScale = depth
      }
      ctx.globalAlpha = this.mistAlpha[i] * FOG_OPACITY
      ctx.fillText('.:-'[this.mistGlyph[i]], this.mistX[i] / depth, this.mistY[i] / (depth * SEA_TILT))
    }
    ctx.restore()
  }

  drawMotes(ctx: CanvasRenderingContext2D): void {
    if (this.insectCount === 0 && this.dustCount === 0) return
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '400 9px "Geist Mono", monospace'
    let previousScale = 1
    for (let i = 0; i < this.dustCount; i++) {
      const depth = this.dustScale[i]
      if (depth !== previousScale) {
        ctx.scale(depth / previousScale, depth / previousScale)
        previousScale = depth
      }
      ctx.globalAlpha = this.dustAlpha[i]
      ctx.fillText(i % 4 === 0 ? "'" : '.', this.dustX[i] / depth, this.dustY[i] / depth)
    }
    ctx.scale(1 / previousScale, 1 / previousScale)
    ctx.font = '400 7px "Geist Mono", monospace'
    for (let i = 0; i < this.insectCount; i++) {
      const phase = this.time * 17 + i * 2.1
      const spread = 2.5 + (0.5 + Math.sin(phase) * 0.5) * 1.5
      const wingY = -1.5 - Math.cos(phase) * 1.2
      ctx.save()
      ctx.translate(this.insectX[i], this.insectY[i])
      ctx.scale(this.insectScale[i], this.insectScale[i])
      ctx.rotate(Math.sin(this.time * 1.2 + i) * 0.45)
      ctx.globalAlpha = this.insectAlpha[i]
      ctx.fillText(':', 0, 0)
      ctx.fillText('/', -spread, wingY)
      ctx.fillText('\\', spread, wingY)
      ctx.fillText('\\', -spread * 0.85, -wingY)
      ctx.fillText('/', spread * 0.85, -wingY)
      ctx.restore()
    }
    ctx.restore()
  }
}
