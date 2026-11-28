import { grain, limbAt, limbCurve, smooth } from './SceneGeometry'
import { EarthSurface } from './EarthSurface'

const RIM = 0.43
const TAU = Math.PI * 2

interface Star {
  x: number
  y: number
  size: number
  phase: number
  speed: number
}

// Position, drift per second, width, altitude above the limb and thickness.
const CURRENTS = [
  [0.13, 0.023, 0.32, 0.088, 0.067],
  [0.63, 0.020, 0.40, 0.079, 0.056],
  [0.32, -0.015, 0.22, 0.151, 0.040],
  [0.82, -0.018, 0.28, 0.134, 0.045],
] as const

/** Twinkling stars, a turning surface and layered currents under the fixed atmospheric limb. */
export class UpperAtmosphere {
  private readonly stars: Star[] = []
  private readonly limb = document.createElement('canvas')
  private readonly surface = new EarthSurface()
  private width = 0
  private height = 0
  private curve = 0

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.stars.length = 0
    const step = 42
    for (let j = 0; j < height / step; j++) {
      for (let i = 0; i < width / step; i++) {
        const size = grain(i + 31, j + 73)
        if (size < 0.45) continue
        const x = (i + grain(i + 45, j)) * step
        const y = (j + grain(i, j + 91)) * step
        if (x >= width || y >= height) continue
        this.stars.push({
          x, y, size,
          phase: TAU * grain(i + 19, j + 63),
          speed: 0.75 + 1.55 * grain(i + 61, j + 24),
        })
      }
    }

    const lw = this.limb.width = Math.max(1, Math.min(Math.round(width), 768))
    const lh = this.limb.height = 240
    const ctx = this.limb.getContext('2d')!
    const pixels = ctx.createImageData(lw, lh)
    const { data } = pixels
    const curve = this.curve = limbCurve(width, height)
    for (let x = 0; x < lw; x++) {
      const u = 2 * (x + 0.5) / lw - 1
      const edge = RIM + curve * u * u
      for (let y = 0; y < lh; y++) {
        const distance = (y + 0.5) / lh - edge
        const i = (y * lw + x) * 4
        if (distance < 0) {
          const outerVeil = 0.12 * smooth(1 - Math.abs(distance + 0.12) / 0.075)
          const air = 0.93 * smooth(1 + distance / 0.065) + 0.105 * smooth(1 + distance / 0.29) + outerVeil
          data[i] = data[i + 1] = data[i + 2] = 255
          data[i + 3] = Math.round(Math.min(1, air) * 255)
        } else {
          const light = 0.92 * smooth(1 - distance / 0.047) + 0.08 * smooth(1 - distance / 0.12)
          data[i] = data[i + 1] = data[i + 2] = Math.round(light * 255)
          data[i + 3] = 255
        }
      }
    }
    ctx.putImageData(pixels, 0, 0)
    this.surface.resize(width, height, curve)
  }

  draw(ctx: CanvasRenderingContext2D, altitude: number, time: number, turn: number): void {
    if (altitude <= 0.34) return
    const w = this.width, h = this.height
    if (altitude > 0.49) this.drawStars(ctx, h * 0.24 * (altitude - 1), smooth((altitude - 0.49) / 0.43), time)

    // The haze resolves into a thin atmospheric limb as the camera clears it.
    const air = smooth((altitude - 0.34) / 0.40)
    ctx.globalAlpha = air
    const { rim, depth } = limbAt(altitude, h)
    const top = rim - RIM * depth
    ctx.drawImage(this.limb, 0, top, w, depth)
    if (top + depth < h) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, top + depth, w, h - top - depth)
    }
    // The limb stays put; only the ground and air beneath it turn about the same axis.
    const currentLight = air * smooth((altitude - 0.55) / 0.35)
    if (currentLight > 0) {
      ctx.globalAlpha = currentLight
      this.surface.draw(ctx, w, rim, depth, turn)
      this.drawCurrents(ctx, rim, depth, currentLight, time, turn)
    }
    ctx.globalAlpha = 1
  }

  private drawStars(ctx: CanvasRenderingContext2D, lift: number, opacity: number, time: number): void {
    // Snap each point to the existing raster: brightness changes, position does not jitter.
    const sx = ctx.canvas.width / this.width, sy = ctx.canvas.height / this.height
    ctx.save()
    ctx.resetTransform()
    ctx.fillStyle = '#fff'
    for (const { x, y, size, phase, speed } of this.stars) {
      const px = Math.floor(x * sx), py = Math.floor((y + lift) * sy)
      if (py < 0 || py >= ctx.canvas.height) continue
      const pulse = 0.5 + 0.5 * Math.sin(time * speed + phase)
      if (size > 0.965) {
        ctx.globalAlpha = opacity * (0.16 + 0.54 * pulse * pulse)
        ctx.fillRect(px - 2, py, 5, 1)
        ctx.fillRect(px, py - 2, 1, 5)
      }
      ctx.globalAlpha = opacity * (size > 0.90 ? 0.68 + 0.30 * pulse : 0.32 + 0.58 * pulse)
      ctx.fillRect(px, py, size > 0.93 ? 2 : 1, 1)
    }
    ctx.restore()
  }

  private drawCurrents(ctx: CanvasRenderingContext2D, rim: number, depth: number, light: number, time: number, turn: number): void {
    const w = this.width, curvature = this.curve * depth
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = '#fff'
    for (const [start, speed, span, level, thickness] of CURRENTS) {
      // Wrap only when the whole tapered ribbon is outside the frame.
      const period = 1 + span
      // Same angular turn as the surface, converted from bearing to a fraction of the frame.
      const travel = start + speed * time + span * 0.5 - turn / 1.14
      const left = travel - Math.floor(travel / period) * period - span
      const right = left + span, middle = (left + right) * 0.5
      const lane = rim - level * depth
      const l = 2 * left - 1, r = 2 * right - 1, m = 2 * middle - 1
      const y1 = lane + curvature * l * l, y2 = lane + curvature * r * r
      // A quadratic control point on the same parabola as the limb keeps the flow attached.
      const center = 2 * (lane + curvature * m * m) - (y1 + y2) * 0.5
      const glow = light * (0.82 + 0.18 * Math.sin(time * 0.88 + start * TAU))
      for (let band = 0; band < 3; band++) {
        const spread = thickness * depth * (1 - 0.27 * band)
        ctx.globalAlpha = glow * (0.08 + 0.03 * band)
        ctx.beginPath()
        ctx.moveTo(w * left, y1)
        ctx.quadraticCurveTo(w * middle, center - spread, w * right, y2)
        ctx.quadraticCurveTo(w * middle, center + spread * 0.54, w * left, y1)
        ctx.fill()
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }
}
