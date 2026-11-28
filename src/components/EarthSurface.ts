import { grain, smooth } from './SceneGeometry'

const MAP_SIZE = 256
const MAP_MASK = MAP_SIZE - 1
const SURFACE_DEPTH = 0.24
const HAZE = 0.044
const GROUND_SCALE = 110
/** Strongest turn at the edge of the window, close to the meadow's parallax travel. */
export const MAX_TURN = Math.PI / 90

function tileNoise(x: number, y: number, period: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const u = smooth(x - ix), v = smooth(y - iy)
  const x0 = ((ix % period) + period) % period, x1 = (x0 + 1) % period
  const y0 = ((iy % period) + period) % period, y1 = (y0 + 1) % period
  const top = grain(x0, y0) + (grain(x1, y0) - grain(x0, y0)) * u
  const bottom = grain(x0, y1) + (grain(x1, y1) - grain(x0, y1)) * u
  return top + (bottom - top) * v
}

function bakeMap(): Uint8Array {
  const map = new Uint8Array(MAP_SIZE * MAP_SIZE)
  for (let y = 0, i = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++, i++) {
      const u = x / MAP_SIZE, v = y / MAP_SIZE
      const shelf = 0.62 * tileNoise(u * 8, v * 8, 8) + 0.28 * tileNoise(u * 16 + 3, v * 16 + 7, 16)
        + 0.10 * tileNoise(u * 32 + 5, v * 32 + 1, 32)
      const lands = smooth((shelf - 0.50) / 0.20)
      const cloud = 0.7 * tileNoise(u * 12 + 9, v * 12 + 4, 12) + 0.3 * tileNoise(u * 24 + 2, v * 24 + 11, 24)
      map[i] = Math.round(46 * lands + 30 * smooth((cloud - 0.56) / 0.26))
    }
  }
  return map
}

/**
 * The surface below the fixed limb, turning about the axis that runs from the viewer to the
 * Earth's center. Every point keeps its range from that axis, so the silhouette never moves.
 */
export class EarthSurface {
  private readonly image = document.createElement('canvas')
  private readonly context = this.image.getContext('2d')!
  private readonly map = bakeMap()
  private pixels: ImageData | null = null
  private range = new Float32Array(0)
  private azimuth = new Float32Array(0)
  private visibility = new Uint8Array(0)
  private lastTurn = Number.NaN

  resize(width: number, height: number, curvature: number): void {
    const w = this.image.width = Math.max(1, Math.min(Math.ceil(width / 2), 384))
    const h = this.image.height = Math.max(1, Math.min(Math.ceil(height * 0.08), 96))
    const pixels = this.pixels = this.context.createImageData(w, h)
    const range = this.range = new Float32Array(w * h)
    const azimuth = this.azimuth = new Float32Array(w * h)
    const visibility = this.visibility = new Uint8Array(w * h)
    this.lastTurn = Number.NaN
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w * 2 - 1
      const edge = curvature * u * u
      const bearing = Math.asin(u * 0.57)
      for (let y = 0, i = x; y < h; y++, i += w) {
        const distance = (y + 0.5) / h * SURFACE_DEPTH - edge
        if (distance <= HAZE) continue // The atmospheric rim keeps its own silhouette and light.
        // Rows near the horizon reach far across the ground; the lowest rows are closest.
        range[i] = GROUND_SCALE * 0.09 / (distance - HAZE + 0.03)
        azimuth[i] = bearing
        visibility[i] = Math.round(255 * smooth((distance - HAZE) / 0.08) * (1 - 0.42 * u * u))
        const p = i * 4
        pixels.data[p] = pixels.data[p + 1] = pixels.data[p + 2] = 255
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, rim: number, depth: number, turn: number): void {
    if (!this.pixels) return
    if (turn !== this.lastTurn) {
      this.lastTurn = turn
      const { data } = this.pixels
      const { map, range, azimuth, visibility } = this
      for (let i = 0; i < visibility.length; i++) {
        if (visibility[i] === 0) continue
        const angle = azimuth[i] + turn
        const gx = range[i] * Math.sin(angle) + 64.5
        const gy = range[i] * Math.cos(angle)
        const x0 = Math.floor(gx), y0 = Math.floor(gy)
        const fx = gx - x0, fy = gy - y0
        const r0 = (y0 & MAP_MASK) * MAP_SIZE, r1 = ((y0 + 1) & MAP_MASK) * MAP_SIZE
        const c0 = x0 & MAP_MASK, c1 = (x0 + 1) & MAP_MASK
        const top = map[r0 + c0] + (map[r0 + c1] - map[r0 + c0]) * fx
        const bottom = map[r1 + c0] + (map[r1 + c1] - map[r1 + c0]) * fx
        data[i * 4 + 3] = Math.round((top + (bottom - top) * fy) * visibility[i] / 255)
      }
      this.context.putImageData(this.pixels, 0, 0)
    }
    ctx.drawImage(this.image, 0, rim, width, depth * SURFACE_DEPTH)
  }
}
