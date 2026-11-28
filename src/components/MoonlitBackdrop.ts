const clamp = (x: number): number => Math.min(1, Math.max(0, x))
const ease = (x: number): number => x * x * (3 - 2 * x)

function hash(x: number, y: number): number {
  let bits = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177)
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967295
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const u = ease(x - ix), v = ease(y - iy)
  const a = hash(ix, iy), b = hash(ix, iy + 1)
  const top = a + (hash(ix + 1, iy) - a) * u
  const bottom = b + (hash(ix + 1, iy + 1) - b) * u
  return top + (bottom - top) * v
}

/** Cache the cloud field on resize; only short water highlights move each frame. */
export class MoonlitBackdrop {
  private readonly sky = document.createElement('canvas')
  private readonly skyContext = this.sky.getContext('2d')!
  private readonly streaks = Float32Array.from({ length: 64 }, (_, i) => hash(i, 51))

  build(width: number, height: number, horizon: number): void {
    const w = this.sky.width = Math.max(1, Math.min(720, Math.round(width / 2)))
    const h = this.sky.height = Math.max(1, Math.min(480, Math.round(horizon / 2)))
    const pixels = this.skyContext.createImageData(w, h)
    const moonY = height * 0.19
    const moonRadius = Math.min(width * 0.105, height * 0.119)
    const aspect = width / height
    const skyFraction = horizon / height
    for (let row = 0, i = 0; row < h; row++) {
      const y = (row + 0.5) / h
      const dy = y * horizon - moonY
      const haze = ease(clamp((y - 0.82) / 0.18))
      const textBand = 1 - ease(clamp((Math.abs(y * skyFraction - 0.436) - 0.055) / 0.075))
      for (let col = 0; col < w; col++, i += 4) {
        const nx = (col + 0.5) / w - 0.5
        const x = nx * aspect
        // Wide sheared cloud ribbons, broken up by finer scales along their edges.
        const u = x * 3.4 + 14
        const v = y * 15.5 - x * 2 + noise(u * 0.68, y * 7 + 20) * 3.2
        const cloud = noise(u, v) * 0.65 + noise(u * 2.1 + 9, v * 2.3) * 0.25
          + noise(u * 5.0, v * 5.5 + 3) * 0.10
        const density = clamp((cloud - 0.405 + y * 0.062) / 0.37)
        const distance = Math.hypot(x * height, dy) / moonRadius
        const halo = (1 - ease(clamp((distance - 0.84) / 0.86))) * 0.13
        const disc = ease(clamp((1.012 - distance) / 0.035))
        const textClearance = 1 - 0.91 * textBand * (1 - ease(clamp((Math.abs(nx) - 0.30) / 0.20)))
        let light = density * density * (0.76 + y * 0.13) * textClearance + halo + haze * 0.88
        light += (0.96 - density ** 5 * 0.50 - light) * disc
        const level = Math.round(clamp(light) * 255)
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = level
        pixels.data[i + 3] = 255
      }
    }
    this.skyContext.putImageData(pixels, 0, 0)
  }

  draw(ctx: CanvasRenderingContext2D, width: number, horizon: number, light: number): void {
    if (light < 1) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, horizon)
    }
    ctx.globalAlpha = light
    ctx.drawImage(this.sky, 0, 0, width, horizon)
    ctx.globalAlpha = 1
  }

  reflect(ctx: CanvasRenderingContext2D, width: number, horizon: number, height: number, age: number, fade: number): void {
    const water = height - horizon
    const span = Math.min(width * 0.21, height * 0.37)
    const n = Math.min(this.streaks.length, Math.max(9, Math.round(water / 4)))
    ctx.fillStyle = '#fff'
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < n; i++) {
      const seed = this.streaks[i]
      const z = (i + 0.25 + seed * 0.5) / n
      const phase = age * (0.37 + 0.21 * seed) + seed * 32
      const swell = 0.58 + 0.42 * Math.sin(phase)
      const half = span * (0.08 + z * 0.83) * (0.22 + seed * 0.78) * swell
      const center = width / 2 + Math.sin(phase * 1.33 + z * 6) * span * (0.012 + z * 0.083)
      const y = horizon + z ** 1.27 * water
      const thickness = 0.75 + z * (0.65 + seed * water / n * 0.66)
      ctx.globalAlpha = fade * Math.min(1, (0.18 + seed * seed) * (0.7 + swell * 0.45))
      ctx.fillRect(center - half, y, half * 2, thickness)
      ctx.globalAlpha *= 0.44
      ctx.fillRect(center - half * 1.25, y + thickness, half * 2.38, 1)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}
