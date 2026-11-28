export const HORIZON = 0.72
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

/** Cached cloud texture in a level view; the sun alone drives the exposure. */
export class DawnLandscape {
  private readonly sky = document.createElement('canvas')
  private readonly skyContext = this.sky.getContext('2d')!
  private readonly glow = document.createElement('canvas')
  private readonly soil = document.createElement('canvas')
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

    this.soil.width = 2
    this.soil.height = 128
    const ground = this.soil.getContext('2d')!
    const falloff = ground.createLinearGradient(0, 0, 0, this.soil.height)
    falloff.addColorStop(0, '#303030')
    falloff.addColorStop(0.20, '#1a1a1a')
    falloff.addColorStop(0.75, '#101010')
    falloff.addColorStop(1, '#000')
    ground.fillStyle = falloff
    ground.fillRect(0, 0, this.soil.width, this.soil.height)
  }

  resize(width: number, height: number): void {
    this.w = width
    this.h = height
    this.sunRadius = Math.min(width * 0.105, height * 0.087)
    const w = this.sky.width = Math.max(1, Math.min(640, Math.round(width / 2)))
    const h = this.sky.height = Math.max(1, Math.min(360, Math.round(height * HORIZON / 2)))
    const pixels = this.skyContext.createImageData(w, h)
    const { data } = pixels
    for (let row = 0, i = 0; row < h; row++) {
      const y = (row + 0.5) / h * HORIZON
      const haze = smooth((y - 0.46) / (HORIZON - 0.46))
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
  }

  draw(ctx: CanvasRenderingContext2D, rise: number): number {
    const { w, h, sunRadius: radius } = this
    const horizon = Math.round(HORIZON * ctx.canvas.height) * h / ctx.canvas.height
    const start = horizon + radius + h * 0.059
    const end = h * SUN_AT_REST
    const y = start + (end - start) * rise
    const x = w * 0.5
    // Zero until the upper rim reaches the horizon. The first glow leads it by a few pixels.
    const elevation = (horizon - y + radius) / (horizon - end + radius)
    const spill = smooth((elevation + 0.035) / 0.38)
    const skyLight = smooth(elevation / 0.86)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    if (spill === 0) return elevation

    if (skyLight > 0) {
      ctx.globalAlpha = skyLight
      ctx.drawImage(this.sky, 0, 0, w, horizon)
    }
    const haloX = Math.min(w * (0.16 + 0.32 * spill), radius * (2 + 2.2 * spill))
    const haloY = Math.min(h * 0.31, radius * (1.4 + 2 * spill))
    ctx.globalAlpha = spill * 0.74
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(this.glow, x - haloX, y - haloY, haloX * 2, haloY * 2)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1

    if (elevation > 0) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // The flat ground occludes the disc and halo, then catches light from the rising sun.
    ctx.fillStyle = '#000'
    ctx.fillRect(0, horizon, w, h - horizon)
    const reach = smooth((elevation - 0.035) / 0.83)
    if (reach > 0) {
      ctx.globalAlpha = smooth((elevation - 0.06) / 0.82)
      ctx.drawImage(this.soil, 0, horizon, w, (h - horizon) * reach)
      ctx.globalAlpha = 1
    }
    return elevation
  }
}
