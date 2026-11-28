export const HORIZON = 0.39
const SUN_AT_REST = 0.15

export const smooth = (x: number): number => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

export function grain(x: number, y: number): number {
  let bits = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177)
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967296
}

function noise(x: number, y: number, period: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const u = smooth(x - ix), v = smooth(y - iy)
  const left = ix % period, right = (ix + 1) % period
  const a = grain(left, iy), b = grain(left, iy + 1)
  const top = a + (grain(right, iy) - a) * u
  const bottom = b + (grain(right, iy + 1) - b) * u
  return top + (bottom - top) * v
}

interface CloudLayer {
  texture: HTMLCanvasElement
  speed: number
  rate: number
  view: number
  tile: number
}

function bakeClouds(layer: CloudLayer, width: number, height: number, high: boolean): void {
  const { texture } = layer
  const span = Math.max(width * 1.5, height * 2.2)
  const tile = layer.tile = Math.max(2, Math.min(768, Math.round(span * 0.42)))
  layer.view = tile * width / span
  layer.rate = Math.min(height, width * 1.8) * layer.speed / span
  // Duplicate the start of the tile so even a viewport crossing the seam takes one blit.
  const w = texture.width = tile + Math.ceil(layer.view) + 1
  const h = texture.height = Math.max(1, Math.min(240, Math.round(height * HORIZON / 2)))
  const ctx = texture.getContext('2d')!
  const pixels = ctx.createImageData(w, h)
  const { data } = pixels
  const period = Math.max(3, Math.round(span / height * (high ? 2.2 : 3.2)))
  const verticalRate = high ? 10.5 : 6.9
  const densityFloor = high ? 0.49 : 0.39
  const densityRange = high ? 0.35 : 0.47
  for (let row = 0; row < h; row++) {
    const y = (row + 0.5) / h
    const strength = 0.31 + 0.15 * smooth((y - 0.44) / 0.56)
    const start = row * w * 4
    for (let col = 0, i = start; col < tile; col++, i += 4) {
      const x = (col + 0.5) / tile * period + (high ? 3 : 15)
      const v = (high ? 44 : 0) + y * verticalRate + noise(x, y * 2.3 + 18, period) * 2.7
      const cloud = noise(x, v, period) * 0.61
        + noise(x * 2 + 4, v * 2.3, period * 2) * 0.29
        + noise(x * 5, v * 5.8 + 2, period * 5) * 0.10
      const light = smooth((cloud - densityFloor) / densityRange)
      data[i] = data[i + 1] = data[i + 2] = 255
      if (high) {
        // Two uneven filaments at solar height, with gaps along the wind.
        const ridge = 0.44 + 0.15 * (noise(x + 0.6, 63, period) - 0.5)
        const ribbon = smooth(1 - Math.abs(y - ridge) / 0.105)
        const thread = smooth(1 - Math.abs(y - ridge + 0.087) / 0.053)
        const cover = smooth((noise(x, 53, period) - 0.16) / 0.68)
        const opacity = (0.25 + 0.34 * cover) * Math.max(ribbon, 0.76 * thread) + 0.14 * light
        data[i + 3] = Math.round(opacity * 255)
      } else {
        data[i + 3] = Math.round(light * strength * 255)
      }
    }
    const copy = (w - tile) * 4
    data.copyWithin(start + tile * 4, start, start + copy)
  }
  ctx.putImageData(pixels, 0, 0)
}

/** Cached sky textures; time shifts only the cloud samples and the strength of the halo. */
export class DawnLandscape {
  private readonly haze = document.createElement('canvas')
  private readonly clouds: CloudLayer[] = [
    { texture: document.createElement('canvas'), speed: 0.0028, rate: 0, view: 1, tile: 1 },
    { texture: document.createElement('canvas'), speed: 0.0105, rate: 0, view: 1, tile: 1 },
  ]
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

    this.haze.width = this.haze.height = 96
    const haze = this.haze.getContext('2d')!
    const air = haze.createLinearGradient(0, 0, 0, 96)
    air.addColorStop(0.49, 'transparent')
    air.addColorStop(0.68, 'rgba(255,255,255,.16)')
    air.addColorStop(0.83, 'rgba(255,255,255,.51)')
    air.addColorStop(1, 'rgba(255,255,255,.82)')
    haze.fillStyle = air
    haze.fillRect(0, 0, 96, 96)
    const falloffX = haze.createLinearGradient(0, 0, 96, 0)
    falloffX.addColorStop(0, 'rgba(255,255,255,.58)')
    falloffX.addColorStop(0.5, '#fff')
    falloffX.addColorStop(1, 'rgba(255,255,255,.58)')
    haze.globalCompositeOperation = 'destination-in'
    haze.fillStyle = falloffX
    haze.fillRect(0, 0, 96, 96)

    this.soil.width = 2
    this.soil.height = 128
    const ground = this.soil.getContext('2d')!
    const falloff = ground.createLinearGradient(0, 0, 0, this.soil.height)
    falloff.addColorStop(0, '#1b1b1b')
    falloff.addColorStop(0.035, '#0c0c0c')
    falloff.addColorStop(0.10, '#000')
    ground.fillStyle = falloff
    ground.fillRect(0, 0, this.soil.width, this.soil.height)
  }

  resize(width: number, height: number): void {
    this.w = width
    this.h = height
    this.sunRadius = Math.min(width * 0.105, height * 0.098)
    bakeClouds(this.clouds[0], width, height, false)
    bakeClouds(this.clouds[1], width, height, true)
  }

  draw(ctx: CanvasRenderingContext2D, rise: number, time: number): number {
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

    const veil = this.clouds[1]
    const veilPhase = time * veil.rate
    const veilOffset = (Math.ceil(veilPhase) - veilPhase) * veil.tile
    if (skyLight > 0) {
      ctx.globalAlpha = skyLight
      ctx.drawImage(this.haze, 0, 0, w, horizon)
      ctx.globalCompositeOperation = 'lighter'
      const clouds = this.clouds[0]
      const phase = time * clouds.rate
      const offset = (Math.ceil(phase) - phase) * clouds.tile
      ctx.drawImage(clouds.texture, offset, 0, clouds.view, clouds.texture.height, 0, 0, w, horizon)
      ctx.globalAlpha = skyLight * 0.32
      ctx.drawImage(veil.texture, veilOffset, 0, veil.view, veil.texture.height, 0, 0, w, horizon)
    }
    const haloX = Math.min(w * (0.16 + 0.32 * spill), radius * (2 + 2.2 * spill))
    const haloY = Math.min(h * 0.31, radius * (1.4 + 2 * spill))
    // Only the dither around the disc breathes; the solar silhouette stays perfectly still.
    const breath = 0.033 * Math.sin(time * 0.66) + 0.009 * Math.sin(time * 1.07)
    ctx.globalAlpha = spill * (0.74 + breath)
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(this.glow, x - haloX, y - haloY, haloX * 2, haloY * 2)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1

    if (elevation > 0) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
      // The same veil gains a soft shadow only where it overlaps the lit disc.
      if (y - radius < horizon) {
        ctx.save()
        ctx.clip()
        ctx.globalCompositeOperation = 'difference'
        ctx.globalAlpha = skyLight * 0.75
        ctx.drawImage(veil.texture, veilOffset, 0, veil.view, veil.texture.height, 0, 0, w, horizon)
        ctx.restore()
      }
    }
    if (time > 0 && skyLight > 0.6) this.drawBirds(ctx, time, skyLight)

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

  private drawBirds(ctx: CanvasRenderingContext2D, time: number, light: number): void {
    // Small groups cross from alternating sides, with quiet intervals between flights.
    const cycle = (time + 10) / 49
    const pass = Math.floor(cycle)
    const elapsed = (cycle - pass) * 49
    if (elapsed >= 35) return
    const direction = pass % 2 === 0 ? 1 : -1
    const size = Math.min(4.8, Math.max(3.1, this.w * 0.004))
    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const progress = (elapsed - i * 1.12) / 31
      if (progress < 0 || progress > 1) continue
      const span = size * (1 - i * 0.105)
      const x = this.w * 0.5 + direction * ((this.w + 20) * progress - this.w * 0.5 - 10)
      const y = this.h * (0.263 + i * 0.010 + 0.012 * Math.sin(progress * 5 + pass * 1.2 + i * 0.71))
        + span * 0.15 * Math.sin(time * 3.7 + i)
      const wing = span * (-0.29 + 0.54 * Math.sin(time * (9 + i * 0.44) + i * 1.9))
      const sweep = direction * span * 0.19
      ctx.moveTo(x - span - sweep, y + wing * 0.9)
      ctx.quadraticCurveTo(x - span * 0.56, y + wing * 1.16 - span * 0.39, x + sweep, y - span * 0.23)
      ctx.quadraticCurveTo(x + span * 0.48, y + wing * 1.17 - span * 0.32, x + span - sweep, y + wing)
      ctx.quadraticCurveTo(x + span * 0.40, y + wing * 0.52 + span * 0.27, x + sweep, y + span * 0.47)
      ctx.quadraticCurveTo(x - span * 0.43, y + wing * 0.55 + span * 0.20, x - span - sweep, y + wing * 0.9)
      ctx.closePath()
    }
    // In the one-bit palette, inversion reads as ink over bright clouds and ivory over dark gaps.
    ctx.globalCompositeOperation = 'difference'
    ctx.globalAlpha = 0.96 * smooth((light - 0.6) / 0.4)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}
