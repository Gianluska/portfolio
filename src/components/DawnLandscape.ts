import { cameraTravel, grain, HORIZON, smooth, SUN_DEPTH } from './SceneGeometry'
import { ValleyBackdrop } from './ValleyBackdrop'
import { UpperAtmosphere } from './UpperAtmosphere'

const SUN_AT_REST = 0.15

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
  lead: number
}

type CloudShape = 'dawn' | 'veil' | 'cumulus' | 'cirrus'

function bakeFlightClouds(shape: 'cumulus' | 'cirrus', pixels: ImageData, tile: number, period: number): void {
  const { data, width, height } = pixels
  const stride = width * 4
  for (let col = 0; col < tile; col++) {
    const x = (col + 0.5) / tile * period + 15
    if (shape === 'cumulus') {
      // Tall crowns pick up light from above; the uneven lower body stays in shadow.
      const mass = noise(x, 76, period)
      const clusters = noise(x * 2 + 9, 82, period * 2)
      const ridge = 0.45 + 0.30 * (mass - 0.5) + 0.10 * (clusters - 0.5)
      const thickness = 0.14 + 0.30 * mass + 0.07 * clusters
      const cover = 0.14 + 0.86 * smooth((mass + 0.38 * (clusters - 0.5) - 0.19) / 0.49)
      for (let row = 0, i = col * 4; row < height; row++, i += stride) {
        const y = (row + 0.5) / height
        const billow = noise(x * 2 + 7, 71 + y * 3, period * 2) - 0.5
        const detail = noise(x * 5 + 2, 87 + y * 9, period * 5) - 0.5
        const depth = (y - ridge) / thickness
        const body = smooth((1 - Math.abs(depth) + 0.50 * billow + 0.22 * detail) / 0.48)
        const facing = smooth((0.68 - depth + 0.58 * detail + 0.48 * billow) / 1.12)
        const folds = 0.72 + 0.28 * smooth(0.52 + 1.28 * billow + 1.55 * detail)
        const feather = smooth(y / 0.15) * smooth((1 - y) / 0.15)
        data[i] = data[i + 1] = data[i + 2] = Math.round(255 * (0.18 + 0.74 * facing * folds))
        data[i + 3] = Math.round(255 * feather * body * cover)
      }
    } else {
      // The higher layer is long, sheared and broken into threads, not a second cloud bank.
      const bend = noise(x, 113, period)
      const shear = noise(x * 2 + 6, 124, period * 2)
      const ridge = 0.38 + 0.34 * (bend - 0.5) + 0.12 * (shear - 0.5)
      const cover = 0.27 + 0.73 * smooth((shear - 0.12) / 0.59)
      for (let row = 0, i = col * 4; row < height; row++, i += stride) {
        const y = (row + 0.5) / height
        const fray = noise(x * 5, y * 4 + 135, period * 5)
        const ribbon = smooth(1 - Math.abs(y - ridge) / (0.075 + 0.10 * shear))
        const thread = smooth(1 - Math.abs(y - ridge - 0.17 - 0.09 * (fray - 0.5)) / 0.058)
        const tail = smooth(1 - Math.abs(y - ridge + 0.13 - 0.08 * (shear - 0.5)) / 0.045)
        const feather = smooth(y / 0.15) * smooth((1 - y) / 0.15)
        data[i] = data[i + 1] = data[i + 2] = 255
        data[i + 3] = Math.round(255 * feather * cover * (0.56 + 0.44 * fray)
          * (0.56 * ribbon + 0.38 * thread + 0.22 * tail))
      }
    }
  }
}

function bakeClouds(layer: CloudLayer, width: number, height: number, shape: CloudShape): void {
  const isFlightCloud = shape === 'cumulus' || shape === 'cirrus'
  const high = shape === 'veil'
  const { texture } = layer
  const span = Math.max(width * 1.5, height * 2.2)
  const tile = layer.tile = Math.max(2, Math.min(768, Math.round(span * 0.42)))
  layer.view = tile * width / span
  layer.rate = Math.min(height, width * 1.8) * layer.speed / span
  // Duplicate the start of the tile so even a viewport crossing the seam takes one blit.
  const w = texture.width = tile + Math.ceil(layer.view) + 1
  const h = Math.max(1, Math.min(240, Math.round(height * HORIZON / 2)))
  // Extend the original sky above the frame so it can descend without exposing a cut edge.
  const pad = isFlightCloud ? 0 : Math.ceil(h * 0.18)
  layer.lead = pad / h
  texture.height = h + pad
  const ctx = texture.getContext('2d')!
  const pixels = ctx.createImageData(w, texture.height)
  const { data } = pixels
  const period = Math.max(3, Math.round(span / height * (high ? 2.2 : shape === 'cirrus' ? 1.55 : 3.2)))
  if (isFlightCloud) bakeFlightClouds(shape, pixels, tile, period)
  else bakeDawnClouds(pixels, tile, period, h, pad, high)
  const copy = (w - tile) * 4
  for (let row = 0, start = 0; row < texture.height; row++, start += w * 4) {
    data.copyWithin(start + tile * 4, start, start + copy)
  }
  ctx.putImageData(pixels, 0, 0)
}

function bakeDawnClouds(pixels: ImageData, tile: number, period: number, h: number, pad: number, high: boolean): void {
  const { data, width: w, height } = pixels
  const verticalRate = high ? 10.5 : 6.9
  const densityFloor = high ? 0.49 : 0.39
  const densityRange = high ? 0.35 : 0.47
  for (let row = 0; row < height; row++) {
    const y = (row - pad + 0.5) / h
    const strength = 0.31 + 0.15 * smooth((y - 0.44) / 0.56)
    const feather = smooth((row + 0.5) / pad)
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
        data[i + 3] = Math.round(opacity * feather * 255)
      } else {
        data[i + 3] = Math.round(light * strength * feather * 255)
      }
    }
  }
}

function cloudOffset(layer: CloudLayer, time: number, camera: number, width: number): number {
  const offset = camera * layer.view / width - time * layer.rate * layer.tile
  return offset - Math.floor(offset / layer.tile) * layer.tile
}

function drawCloud(ctx: CanvasRenderingContext2D, layer: CloudLayer, offset: number, width: number, top: number, height: number): void {
  const lead = height * layer.lead
  ctx.drawImage(layer.texture, offset, 0, layer.view, layer.texture.height, 0, top - lead, width, height + lead)
}

/** Composes the sky, solar exposure and wooded valley at their respective depths. */
export class DawnLandscape {
  private readonly haze = document.createElement('canvas')
  private readonly clouds: CloudLayer[] = [
    { texture: document.createElement('canvas'), speed: 0.0028, rate: 0, view: 1, tile: 1, lead: 0 },
    { texture: document.createElement('canvas'), speed: 0.0105, rate: 0, view: 1, tile: 1, lead: 0 },
  ]
  private readonly cumulus: CloudLayer = {
    texture: document.createElement('canvas'), speed: 0.011, rate: 0, view: 1, tile: 1, lead: 0,
  }
  private readonly cirrus: CloudLayer = {
    texture: document.createElement('canvas'), speed: -0.004, rate: 0, view: 1, tile: 1, lead: 0,
  }
  private readonly atmosphere = new UpperAtmosphere()
  private readonly valley = new ValleyBackdrop()
  private readonly glow = document.createElement('canvas')
  private readonly solarWave = document.createElement('canvas')
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

    this.solarWave.width = this.solarWave.height = 128
    const wave = this.solarWave.getContext('2d')!
    const pulse = wave.createRadialGradient(64, 64, 0, 64, 64, 64)
    pulse.addColorStop(0, 'rgba(255,255,255,0)')
    pulse.addColorStop(0.40, 'rgba(255,255,255,0)')
    pulse.addColorStop(0.56, 'rgba(255,255,255,.16)')
    pulse.addColorStop(0.68, 'rgba(255,255,255,.42)')
    pulse.addColorStop(0.77, 'rgba(255,255,255,.30)')
    pulse.addColorStop(0.89, 'rgba(255,255,255,.08)')
    pulse.addColorStop(1, 'rgba(255,255,255,0)')
    wave.fillStyle = pulse
    wave.fillRect(0, 0, 128, 128)

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
    bakeClouds(this.clouds[0], width, height, 'dawn')
    bakeClouds(this.clouds[1], width, height, 'veil')
    bakeClouds(this.cumulus, width, height, 'cumulus')
    bakeClouds(this.cirrus, width, height, 'cirrus')
    this.atmosphere.resize(width, height)
    this.valley.resize(width, height)
  }

  draw(
    ctx: CanvasRenderingContext2D, rise: number, time: number, camera: number, altitude: number,
    groundOffset: number, launchGlow: number, launchProgress: number, earthSteer: number,
  ): number {
    const { w, h, sunRadius: radius } = this
    const horizon = Math.round(HORIZON * ctx.canvas.height) * h / ctx.canvas.height
    const start = horizon + radius + h * 0.059
    const end = h * SUN_AT_REST
    const y = start + (end - start) * rise
    const x = w * 0.5 - camera * SUN_DEPTH
    // Zero until the upper rim reaches the horizon. The first glow leads it by a few pixels.
    const elevation = (horizon - y + radius) / (horizon - end + radius)
    const spill = smooth((elevation + 0.035) / 0.38)
    const skyLight = smooth(elevation / 0.86) * (1 - smooth((altitude - 0.12) / 0.40))
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    if (spill === 0) return elevation
    this.atmosphere.draw(ctx, altitude, time, earthSteer)

    const veil = this.clouds[1]
    const veilTop = h * altitude * 2.8
    const veilOffset = skyLight > 0 ? cloudOffset(veil, time, camera * 0.38, w) : 0
    if (skyLight > 0) {
      ctx.globalAlpha = skyLight
      ctx.drawImage(this.haze, 0, groundOffset, w, horizon)
      ctx.globalCompositeOperation = 'lighter'
      const clouds = this.clouds[0]
      const offset = cloudOffset(clouds, time, camera * 0.17, w)
      drawCloud(ctx, clouds, offset, w, h * altitude * 2.35, horizon)
      ctx.globalAlpha = skyLight * 0.32
      drawCloud(ctx, veil, veilOffset, w, veilTop, horizon)
    }
    if (altitude > 0 && altitude < 0.73) {
      ctx.globalCompositeOperation = 'source-over'
      // The near billows sweep past first; the distant wisps linger up into the stratosphere.
      this.drawFlightCloud(ctx, this.cirrus, time, -0.56 + 1.89 * altitude, 0.32,
        smooth((altitude - 0.14) / 0.15) * (1 - smooth((altitude - 0.49) / 0.24)))
      this.drawFlightCloud(ctx, this.cumulus, time, -0.62 + 3.16 * altitude, 0.54,
        smooth(altitude / 0.125) * (1 - smooth((altitude - 0.34) / 0.17)))
    }
    const thinAir = smooth((altitude - 0.22) / 0.66)
    const expansion = (1 - 0.50 * thinAir) * (1 + 0.13 * launchGlow)
    const haloX = Math.min(w * (0.16 + 0.32 * spill), radius * (2 + 2.2 * spill)) * expansion
    const haloY = Math.min(h * 0.31, radius * (1.4 + 2 * spill)) * expansion
    // The dither around the disc breathes without changing the size of the sun.
    const breath = 0.033 * Math.sin(time * 0.66) + 0.009 * Math.sin(time * 1.07)
    ctx.globalAlpha = spill * ((0.74 + breath) * (1 - thinAir) + 0.13 * thinAir)
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(this.glow, x - haloX, y - haloY, haloX * 2, haloY * 2)
    if (launchGlow > 0) {
      // The wave carries light outward instead of brightening the whole halo in place.
      const reach = radius * (1.35 + 2.85 * smooth(launchProgress))
      ctx.globalAlpha = launchGlow
      ctx.drawImage(this.solarWave, x - reach, y - reach, reach * 2, reach * 2)
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1

    if (elevation > 0) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
      // The same veil gains a soft shadow only where it overlaps the lit disc.
      if (skyLight > 0 && y + radius > veilTop - horizon * veil.lead && y - radius < veilTop + horizon) {
        ctx.save()
        ctx.clip()
        ctx.globalCompositeOperation = 'difference'
        ctx.globalAlpha = skyLight * 0.75
        drawCloud(ctx, veil, veilOffset, w, veilTop, horizon)
        ctx.restore()
      }
    }
    if (time > 0 && skyLight > 0.6) this.drawBirds(ctx, time, skyLight, camera, groundOffset * 0.84)
    const ground = horizon + groundOffset
    if (ground - h * 0.14 >= h) return elevation
    this.valley.draw(ctx, ground, camera, smooth((elevation + 0.015) / 0.68))

    // The flat ground occludes the disc and halo, then catches light from the rising sun.
    if (ground >= h) return elevation
    ctx.fillStyle = '#000'
    ctx.fillRect(0, ground, w, h - ground)
    const reach = smooth((elevation - 0.035) / 0.83)
    if (reach > 0) {
      ctx.globalAlpha = smooth((elevation - 0.06) / 0.82)
      ctx.drawImage(this.soil, 0, ground, w, (h - horizon) * reach)
      ctx.globalAlpha = 1
    }
    return elevation
  }

  private drawFlightCloud(ctx: CanvasRenderingContext2D, layer: CloudLayer, time: number, top: number, thickness: number, opacity: number): void {
    if (top + thickness <= 0 || top >= 1 || opacity === 0) return
    ctx.globalAlpha = opacity
    drawCloud(ctx, layer, cloudOffset(layer, time, 0, this.w), this.w, this.h * top, this.h * thickness)
  }

  private drawBirds(ctx: CanvasRenderingContext2D, time: number, light: number, camera: number, offset: number): void {
    // Small groups cross from alternating sides, with quiet intervals between flights.
    const cycle = (time + 10) / 49
    const pass = Math.floor(cycle)
    const elapsed = (cycle - pass) * 49
    if (elapsed >= 35) return
    const direction = pass % 2 === 0 ? 1 : -1
    const size = Math.min(4.8, Math.max(3.1, this.w * 0.004))
    const margin = 10 + cameraTravel(this.w) * 0.46
    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const progress = (elapsed - i * 1.12) / 31
      if (progress < 0 || progress > 1) continue
      const span = size * (1 - i * 0.105)
      const x = this.w * 0.5 + direction * (this.w + margin * 2) * (progress - 0.5) - camera * 0.46
      const y = this.h * (0.263 + i * 0.010 + 0.012 * Math.sin(progress * 5 + pass * 1.2 + i * 0.71))
        + span * 0.15 * Math.sin(time * 3.7 + i) + offset
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
