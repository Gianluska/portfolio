const INSECTS = 8
const DUST = 32
const MIST_BANKS = 3
const MIST_COLUMNS = 56
const MIST_ROWS = 7
const MIST_POINTS = MIST_BANKS * MIST_COLUMNS * MIST_ROWS

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
  private readonly dustX = new Float32Array(DUST)
  private readonly dustY = new Float32Array(DUST)
  private readonly dustAlpha = new Float32Array(DUST)
  private readonly mistX = new Float32Array(MIST_POINTS)
  private readonly mistY = new Float32Array(MIST_POINTS)
  private readonly mistAlpha = new Float32Array(MIST_POINTS)
  private readonly mistGlyph = new Uint8Array(MIST_POINTS)
  private readonly mistTexture = Float32Array.from({ length: MIST_POINTS }, (_, i) => seed(i, 19))
  private readonly veil = document.createElement('canvas')
  private readonly banks = Array.from({ length: MIST_BANKS }, () => ({
    x: 0, y: 0, radiusX: 0, radiusY: 0, alpha: 0,
  }))
  private bankCount = 0

  constructor() {
    // Cache the faint light scattering once; moving fog costs only three image draws.
    this.veil.width = 256
    this.veil.height = 96
    const ctx = this.veil.getContext('2d')
    if (!ctx) throw new Error('The river mist requires a 2D canvas context')
    for (let lobe = 0; lobe < 3; lobe++) {
      ctx.save()
      ctx.translate(65 + lobe * 63, 48 + (lobe === 1 ? -8 : 6))
      ctx.scale(65 + (lobe === 1 ? 15 : 0), 30)
      const scatter = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
      scatter.addColorStop(0, 'rgba(255,255,255,0.7)')
      scatter.addColorStop(0.45, 'rgba(255,255,255,0.3)')
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
    if (!enabled || !Number.isFinite(time) || time <= 0 || width <= 0 || height <= 0) return
    this.time = time
    const entrance = fade(time / 2)
    const area = width * height
    this.insectCount = Math.min(INSECTS, Math.max(3, Math.floor(area / 150000)))
    this.dustCount = Math.min(DUST, Math.max(12, Math.floor(area / 40000)))

    for (let i = 0; i < this.insectCount; i++) {
      const life = 20 + i * 1.7
      const flight = time + i * 4.3
      const birth = Math.floor(flight / life)
      const age = flight - birth * life
      const identity = birth * INSECTS + i
      const phase = age * (1.2 + seed(identity, 1) * 0.6) + i * 2.1
      const anchorX = width * (0.12 + seed(identity, 2) * 0.76)
      const anchorY = height * (0.27 + seed(identity, 3) * 0.58)
      // Loitering loops with smaller course corrections, rather than straight particle rain.
      this.insectX[i] = anchorX + Math.sin(phase) * 23 + Math.sin(phase * 2.3) * 5 + age * 0.8
      this.insectY[i] = anchorY + Math.cos(phase * 0.83) * 14 + Math.sin(phase * 1.7) * 5
      this.insectAlpha[i] = entrance * fade(age / 1.2) * fade((life - age) / 1.5)
        * (0.36 + seed(identity, 4) * 0.16)
    }

    for (let i = 0; i < this.dustCount; i++) {
      const life = 18 + seed(i, 5) * 12
      const progress = (time / life + seed(i, 6)) % 1
      const phase = time * 0.35 + i * 2.4
      this.dustX[i] = (width * seed(i, 7) + progress * 65 + Math.sin(phase) * 10) % (width + 20) - 10
      this.dustY[i] = height * (0.28 + seed(i, 8) * 0.62) - progress * 65 + Math.cos(phase * 0.7) * 5
      this.dustAlpha[i] = entrance * fade(progress / 0.12) * fade((1 - progress) / 0.18)
        * (0.14 + seed(i, 9) * 0.18)
    }

    const banks = width < 640 ? 2 : MIST_BANKS
    const columns = width < 640 ? 32 : MIST_COLUMNS
    const radiusX = Math.min(330, width * 0.65)
    for (let bank = 0; bank < banks; bank++) {
      const travel = width + radiusX * 2
      const progress = (seed(bank, 10) + time * (7 + bank * 1.5) / travel) % 1
      const centreX = -radiusX + progress * travel
      const centreY = height * (0.32 + bank * 0.23) + Math.sin(time * 0.12 + bank) * 12
      const radiusY = 28 + bank * 8
      const veil = this.banks[this.bankCount++]
      veil.x = centreX
      veil.y = centreY
      veil.radiusX = radiusX
      veil.radiusY = radiusY * 1.5
      veil.alpha = entrance * (0.055 + Math.sin(time * 0.14 + bank) * 0.012)
      for (let row = 0; row < MIST_ROWS; row++) {
        const v = row / (MIST_ROWS - 1) * 2 - 1
        const vertical = (1 - v * v) ** 2
        if (vertical === 0) continue
        for (let col = 0; col < columns; col++) {
          const u = col / (columns - 1) * 2 - 1
          const texture = this.mistTexture[(bank * MIST_ROWS + row) * MIST_COLUMNS + col]
          if (texture < 0.2) continue
          const alpha = entrance * (1 - u * u) ** 2 * vertical * (0.045 + texture * 0.065)
          if (alpha < 0.004) continue
          const point = this.mistCount++
          this.mistX[point] = centreX + u * radiusX + (texture - 0.5) * 7
          this.mistY[point] = centreY + v * radiusY
            + Math.sin(u * 5 - time * 0.18 + bank) * radiusY * 0.28
          this.mistAlpha[point] = alpha
          this.mistGlyph[point] = texture < 0.45 ? 0 : texture < 0.75 ? 1 : 2
        }
      }
    }
  }

  /** Low veils sit behind the ship and birds, never bleaching their silhouettes. */
  drawMist(ctx: CanvasRenderingContext2D): void {
    if (this.mistCount === 0) return
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.font = '400 12px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < this.bankCount; i++) {
      const bank = this.banks[i]
      ctx.globalAlpha = bank.alpha
      ctx.drawImage(this.veil, bank.x - bank.radiusX, bank.y - bank.radiusY,
        bank.radiusX * 2, bank.radiusY * 2)
    }
    for (let i = 0; i < this.mistCount; i++) {
      ctx.globalAlpha = this.mistAlpha[i]
      ctx.fillText('.:-'[this.mistGlyph[i]], this.mistX[i], this.mistY[i])
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
    for (let i = 0; i < this.dustCount; i++) {
      ctx.globalAlpha = this.dustAlpha[i]
      ctx.fillText(i % 4 === 0 ? "'" : '.', this.dustX[i], this.dustY[i])
    }
    ctx.font = '400 7px "Geist Mono", monospace'
    for (let i = 0; i < this.insectCount; i++) {
      const phase = this.time * 17 + i * 2.1
      const spread = 2.5 + (0.5 + Math.sin(phase) * 0.5) * 1.5
      const wingY = -1.5 - Math.cos(phase) * 1.2
      ctx.save()
      ctx.translate(this.insectX[i], this.insectY[i])
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
