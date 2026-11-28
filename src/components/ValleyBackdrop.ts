import { cameraTravel, grain, smooth } from './SceneGeometry'

const RIDGES = [
  { depth: 0.13, shade: 0.43, grove: { count: 152, opacity: 0.38, min: 0.004, range: 0.013 },
    profile: [0.033, 0.087, 0.109, 0.074, 0.029, 0.014, 0.031, 0.068, 0.099, 0.073, 0.044] },
  { depth: 0.22, shade: 0.66, grove: { count: 153, opacity: 0.63, min: 0.008, range: 0.017 },
    profile: [0.053, 0.066, 0.050, 0.026, 0.015, 0.009, 0.019, 0.043, 0.063, 0.050, 0.028] },
  { depth: 0.32, shade: 0.62, grove: null,
    profile: [0.012, 0.027, 0.024, 0.009, 0.003, 0, 0.007, 0.023, 0.026, 0.010, 0.014] },
] as const

const TREES = [
  { x: 0.057, height: 0.037, pine: false },
  { x: 0.145, height: 0.067, pine: true },
  { x: 0.191, height: 0.047, pine: true },
  { x: 0.226, height: 0.028, pine: false },
  { x: 0.315, height: 0.022, pine: false },
  { x: 0.708, height: 0.031, pine: false },
  { x: 0.786, height: 0.055, pine: true },
  { x: 0.816, height: 0.038, pine: true },
  { x: 0.893, height: 0.028, pine: false },
  { x: 0.969, height: 0.048, pine: true },
  { x: 0.094, height: 0.026, pine: false },
  { x: 0.260, height: 0.039, pine: true },
  { x: 0.285, height: 0.023, pine: false },
  { x: 0.369, height: 0.025, pine: true },
  { x: 0.647, height: 0.027, pine: true },
  { x: 0.742, height: 0.026, pine: false },
  { x: 0.859, height: 0.033, pine: true },
  { x: 0.929, height: 0.022, pine: false },
] as const

function ridgeHeight(profile: readonly number[], x: number, layer: number): number {
  const point = Math.min(profile.length - 1, Math.max(0, x * (profile.length - 1)))
  const i = Math.min(profile.length - 2, Math.floor(point))
  const t = smooth(point - i)
  const detail = Math.sin(x * 92 + layer * 3.1) * 0.0011 + Math.sin(x * 231 + 4.6) * 0.00055
  return Math.max(0, profile[i] + (profile[i + 1] - profile[i]) * t + detail)
}

function crown(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number): void {
  ctx.beginPath()
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9
    const r = 0.79 + 0.21 * grain(seed, i)
    const px = x + w * r * Math.cos(a), py = y + h * r * Math.sin(a)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

function araucaria(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, seed: number): void {
  const bend = (grain(seed, 13) - 0.5) * h * 0.16
  ctx.beginPath()
  ctx.moveTo(x - h * 0.027, y)
  ctx.quadraticCurveTo(x + bend * 0.28 - h * 0.021, y - h * 0.50, x + bend, y - h * 0.96)
  ctx.quadraticCurveTo(x + bend * 0.58 + h * 0.023, y - h * 0.46, x + h * 0.029, y)
  ctx.fill()
  for (let tier = 0; tier < 3; tier++) {
    const branchY = y - h * (0.53 + tier * 0.109)
    const trunk = x + bend * (0.58 + tier * 0.13)
    for (let side = -1; side <= 1; side += 2) {
      const id = seed * 17 + tier * 2 + (side + 1) / 2
      const spread = h * (0.19 + tier * 0.06 + grain(id, 5) * 0.076)
      const tipX = trunk + side * spread
      const tipY = branchY - h * (0.105 + grain(id, 8) * 0.07)
      ctx.beginPath()
      ctx.moveTo(trunk, branchY + h * 0.017)
      ctx.quadraticCurveTo(trunk + side * spread * 0.82, branchY + h * 0.036, tipX, tipY)
      ctx.quadraticCurveTo(trunk + side * spread * 0.72, branchY - h * 0.006, trunk, branchY - h * 0.021)
      ctx.fill()
      crown(ctx, tipX, tipY, h * (0.10 + tier * 0.026), h * 0.044, id)
    }
  }
  crown(ctx, x + bend, y - h * 0.91, h * 0.22, h * 0.061, seed)
}

function broadleaf(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, seed: number): void {
  ctx.beginPath()
  ctx.moveTo(x - h * 0.051, y)
  ctx.lineTo(x - h * 0.021, y - h * 0.42)
  ctx.lineTo(x - h * 0.27, y - h * 0.66)
  ctx.lineTo(x + h * 0.02, y - h * 0.52)
  ctx.lineTo(x + h * 0.25, y - h * 0.73)
  ctx.lineTo(x + h * 0.056, y - h * 0.37)
  ctx.lineTo(x + h * 0.055, y)
  ctx.fill()
  for (let i = 0; i < 6; i++) {
    const side = (i - 2.5) / 2.5
    crown(ctx, x + h * side * 0.39, y - h * (0.55 + (1 - side * side) * 0.20 + grain(seed, i) * 0.11),
      h * (0.15 + grain(seed, i + 11) * 0.12), h * (0.14 + grain(seed, i + 21) * 0.12), seed + i)
  }
}

function bakeValleyMist(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const w = canvas.width = 160, h = canvas.height = 48
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(w, h)
  for (let row = 0; row < h; row++) {
    const y = (row + 0.5) / h
    for (let col = 0; col < w; col++) {
      const x = (col + 0.5) / w
      const left = 0.66 * Math.exp(-(((x - 0.21) / 0.167) ** 2 + ((y - 0.55) / 0.25) ** 2))
      const right = 0.60 * Math.exp(-(((x - 0.80) / 0.184) ** 2 + ((y - 0.63) / 0.25) ** 2))
      const i = (row * w + col) * 4
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255
      image.data[i + 3] = Math.round((left + right) * smooth(y / 0.29) * 255)
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

/** Three cached silhouettes. Near trees stand against the lighter folds of the distant valley. */
export class ValleyBackdrop {
  private readonly layers = RIDGES.map(() => document.createElement('canvas'))
  private readonly mist = bakeValleyMist()
  private width = 0
  private rise = 0
  private pad = 0

  resize(width: number, height: number): void {
    this.pad = Math.ceil(cameraTravel(width) + 2)
    this.width = width + this.pad * 2
    const scale = Math.min(height, width * 1.23)
    this.rise = scale * 0.133
    const rasterWidth = Math.max(1, Math.min(1800, Math.ceil(this.width)))
    for (let layer = 0; layer < this.layers.length; layer++) {
      const canvas = this.layers[layer]
      const { profile, grove } = RIDGES[layer]
      canvas.width = rasterWidth
      canvas.height = Math.max(1, Math.ceil((this.rise + 2) * rasterWidth / this.width))
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(rasterWidth / this.width, 0, 0, canvas.height / (this.rise + 2), this.pad * rasterWidth / this.width, 0)
      ctx.fillStyle = '#000'
      if (grove) {
        for (let i = 0; i < grove.count; i++) {
          const id = 1000 + layer * 256 + i
          const x = (i + grain(id, 38)) / grove.count
          const cluster = 0.5 + 0.5 * Math.sin(x * (29 + layer * 7) + 2 + layer)
          // Keep a break at the lowest point of the valley so the three crests stay distinct.
          if (grain(id, 44) > 0.23 + cluster * 0.63 || (x > 0.43 && x < 0.57 && i % 5 !== 0)) continue
          const y = this.rise - scale * ridgeHeight(profile, x, layer) + 1
          const height = scale * (grove.min + grain(id, 57) * grove.range)
          if (grain(id, 6) < 0.42) araucaria(ctx, x * width, y, height, id)
          else broadleaf(ctx, x * width, y, height, id)
        }
        // Attenuate the grove as one silhouette so overlapping crowns don't darken the mist.
        ctx.globalCompositeOperation = 'destination-in'
        ctx.globalAlpha = grove.opacity
        ctx.fillRect(-this.pad, 0, this.width, this.rise + 2)
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.beginPath()
      const samples = Math.max(90, Math.min(320, Math.ceil(width / 4)))
      for (let i = 0; i <= samples; i++) {
        const x = this.width * i / samples - this.pad
        const y = this.rise - scale * ridgeHeight(profile, x / width, layer)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineTo(width + this.pad, this.rise + 2)
      ctx.lineTo(-this.pad, this.rise + 2)
      ctx.fill()

      if (!grove) {
        for (let i = 0; i < TREES.length; i++) {
          const { x, height: treeHeight, pine } = TREES[i]
          const y = this.rise - scale * ridgeHeight(profile, x, layer) + 1
          if (pine) araucaria(ctx, x * width, y, scale * treeHeight, i + 93)
          else broadleaf(ctx, x * width, y, scale * treeHeight, i + 113)
        }
        // Soften the trunks and ridge into the mist before they meet the dark grass.
        const haze = ctx.createLinearGradient(0, this.rise - scale * 0.042, 0, this.rise)
        haze.addColorStop(0, '#fff')
        haze.addColorStop(1, 'rgba(255,255,255,.42)')
        ctx.globalCompositeOperation = 'destination-in'
        ctx.fillStyle = haze
        ctx.fillRect(-this.pad, 0, this.width, this.rise + 2)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, horizon: number, camera: number, light: number): void {
    if (light <= 0) return
    for (let i = 0; i < this.layers.length; i++) {
      if (i === 2) {
        // A low bank of morning mist separates the dark crowns from the distant ridges.
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = light
        ctx.drawImage(this.mist, -this.pad - camera * 0.27, horizon - this.rise, this.width, this.rise + 2)
        ctx.globalCompositeOperation = 'source-over'
      }
      const { depth, shade } = RIDGES[i]
      ctx.globalAlpha = shade * light
      ctx.drawImage(this.layers[i], -this.pad - camera * depth, horizon - this.rise, this.width, this.rise + 2)
    }
    ctx.globalAlpha = 1
  }
}
