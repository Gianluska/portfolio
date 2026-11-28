const HORIZON = 0.60
const SUN_AT_REST = 0.205

export const smooth = (x: number): number => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

export function grain(x: number, y: number): number {
  let bits = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177)
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967296
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const u = smooth(x - ix), v = smooth(y - iy)
  const a = grain(ix, iy), b = grain(ix, iy + 1)
  const top = a + (grain(ix + 1, iy) - a) * u
  const bottom = b + (grain(ix + 1, iy + 1) - b) * u
  return top + (bottom - top) * v
}

/** Low saddle in the center; the same profile anchors the farthest stems. */
export function meadowEdge(x: number): number {
  return HORIZON + 0.024 * Math.cos((x - 0.46) * 7.7) + 0.019 * Math.sin(x * 13.1 + 0.6)
}

/** Static scattering and three rolling ridges; only solar position and exposure change. */
export class DawnLandscape {
  private readonly sky = document.createElement('canvas')
  private readonly skyContext = this.sky.getContext('2d')!
  private readonly glow = document.createElement('canvas')
  private readonly ridges = [new Path2D(), new Path2D(), new Path2D()]
  private soil!: CanvasGradient
  private w = 1
  private h = 1
  private sunRadius = 1

  constructor() {
    this.glow.width = this.glow.height = 96
    const ctx = this.glow.getContext('2d')!
    const halo = ctx.createRadialGradient(48, 48, 0, 48, 48, 48)
    halo.addColorStop(0, 'rgba(255,255,255,.68)')
    halo.addColorStop(0.27, 'rgba(255,255,255,.36)')
    halo.addColorStop(0.62, 'rgba(255,255,255,.105)')
    halo.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, 96, 96)
  }

  resize(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.w = width
    this.h = height
    this.sunRadius = Math.min(width * 0.105, height * 0.087)
    const w = this.sky.width = Math.max(1, Math.min(640, Math.round(width / 2)))
    const h = this.sky.height = Math.max(1, Math.min(330, Math.round(height * 0.66 / 2)))
    const pixels = this.skyContext.createImageData(w, h)
    const { data } = pixels
    for (let row = 0, i = 0; row < h; row++) {
      const y = (row + 0.5) / h * 0.66
      const haze = smooth((y - 0.39) / 0.24)
      const caption = smooth((0.135 - Math.abs(y - 0.423)) / 0.065)
      for (let col = 0; col < w; col++, i += 4) {
        const sx = (col + 0.5) / w - 0.5
        const u = sx * width / height * 3.2 + 17
        const v = y * 17.5 - sx * 1.3 + noise(u * 0.65, y * 6 + 18) * 2.7
        const cloud = noise(u, v) * 0.61 + noise(u * 2.1 + 4, v * 2.3) * 0.29 + noise(u * 5.1, v * 5.8 + 2) * 0.10
        const wisps = smooth((cloud - 0.43) / 0.43)
        const textClear = 1 - 0.92 * caption * (1 - smooth((Math.abs(sx) - 0.29) / 0.21))
        const light = (wisps * (0.39 + haze * 0.29) + haze * (0.19 + (1 - Math.abs(sx) * 2) * 0.47)) * textClear
        data[i] = data[i + 1] = data[i + 2] = Math.round(Math.min(1, light) * 255)
        data[i + 3] = 255
      }
    }
    this.skyContext.putImageData(pixels, 0, 0)

    for (let i = 0; i < this.ridges.length; i++) {
      const path = this.ridges[i] = new Path2D()
      path.moveTo(0, height)
      for (let col = 0; col <= 96; col++) {
        const x = col / 96
        const profile = i === 2 ? meadowEdge(x)
          : HORIZON - (i === 0 ? 0.064 : 0.029)
            + 0.027 * Math.cos(x * (i === 0 ? 8.3 : 11.7) + i * 2.1)
            + 0.018 * Math.sin(x * 19 - i * 1.8) + (noise(x * 15, i + 6) - 0.5) * 0.013
        path.lineTo(x * width, profile * height)
      }
      path.lineTo(width, height)
      path.closePath()
    }
    this.soil = ctx.createLinearGradient(0, height * 0.58, 0, height)
    this.soil.addColorStop(0, '#151515')
    this.soil.addColorStop(0.24, '#292929')
    this.soil.addColorStop(0.76, '#171717')
    this.soil.addColorStop(1, '#030303')
  }

  draw(ctx: CanvasRenderingContext2D, rise: number, light: number): void {
    const { w, h, sunRadius: radius } = this
    const x = w * (0.5 + (rise - 1) * 0.021)
    const y = h * (0.74 + (SUN_AT_REST - 0.74) * rise)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 0.08 + 0.88 * light
    ctx.drawImage(this.sky, 0, 0, w, h * 0.66)
    ctx.globalAlpha = 0.20 + light * 0.62
    const haloX = Math.min(w * 0.48, radius * 4.2)
    const haloY = Math.min(h * 0.31, radius * 3.4)
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(this.glow, x - haloX, y - haloY, haloX * 2, haloY * 2)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    // The ridges occlude the actual disc, not just a cropped image of it.
    ctx.fillStyle = '#202020'
    ctx.fill(this.ridges[0])
    ctx.fillStyle = '#111'
    ctx.fill(this.ridges[1])
    ctx.fillStyle = '#000'
    ctx.fill(this.ridges[2])
    ctx.globalAlpha = 0.24 + light * 0.76
    ctx.fillStyle = this.soil
    ctx.fill(this.ridges[2])
    ctx.globalAlpha = 1
  }
}
