import { cameraTravel, grain, HORIZON, smooth, SUN_DEPTH } from './SceneGeometry'

interface Stem {
  x: number
  y: number
  length: number
  width: number
  lean: number
  flex: number
  depth: number
  gustSin: number
  gustCos: number
  rippleSin: number
  rippleCos: number
  arch: number
}

function blade(x: number, y: number, length: number, width: number, gustPhase: number, ripplePhase: number, id: number, depth: number): Stem {
  return {
    x, y, length, width, depth,
    gustSin: Math.sin(gustPhase), gustCos: Math.cos(gustPhase),
    rippleSin: Math.sin(ripplePhase), rippleCos: Math.cos(ripplePhase),
    lean: (grain(id, 16) - 0.43) * 1.05,
    flex: 0.62 + grain(id, 17) * 0.55,
    arch: 0.16 + grain(id, 20) * 0.22,
  }
}

function bakeDawnLight(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const size = canvas.width = canvas.height = 96
  const center = size * 0.5
  const ctx = canvas.getContext('2d')!
  const light = ctx.createRadialGradient(center, center, 0, center, center, center)
  light.addColorStop(0.42, '#fff')
  light.addColorStop(0.60, 'rgba(255,255,255,.82)')
  light.addColorStop(0.78, 'rgba(255,255,255,.39)')
  light.addColorStop(0.94, 'rgba(255,255,255,.04)')
  light.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, size, size)
  return canvas
}

/** A dark horizon silhouette and lit blades that fall away into the foreground. */
export class WindMeadow {
  private readonly stems: Stem[] = []
  private readonly groundBlades: Stem[] = []
  private readonly strip = document.createElement('canvas')
  private readonly stripContext = this.strip.getContext('2d')!
  private bandTop = 0
  private bandHeight = 0
  private width = 0
  private readonly groundFalloff = document.createElement('canvas')
  private readonly dawnLight = bakeDawnLight()
  private groundEdge = 0
  private groundReach = 0

  resize(width: number, height: number, rasterWidth: number, rasterHeight: number): number {
    this.stems.length = 0
    this.groundBlades.length = 0
    const edge = height * HORIZON
    const scale = Math.min(height, width * 1.7)
    const count = Math.min(510, Math.max(32, Math.ceil(rasterWidth / 2.65)))
    const spacing = width / count
    const pixel = width / rasterWidth
    const pad = cameraTravel(width) + scale * 0.06
    const fringe = Math.ceil(pad / spacing)
    let top = edge
    for (let i = -fringe; i < count + fringe; i++) {
      const center = (i + 0.5 + (grain(i, 3) - 0.5) * 0.46) / count
      const stand = 0.5 + 0.5 * Math.sin(center * 31 + 0.8) * Math.cos(center * 11 - 0.5)
      const leaves = 5 + Math.floor(stand * 2.2)
      for (let j = 0; j < leaves; j++) {
        const id = i * 8 + j
        const spread = (j + 0.24 + 0.52 * grain(id, 4)) / leaves - 0.5
        const x = center * width + spread * spacing
        const depth = grain(id, 8)
        const y = edge + scale * (0.0004 + depth * 0.007)
        const vigor = grain(id, 14)
        // Each group has short cover, with taller blades woven through it.
        const baseLength = scale * (j === 0 ? 0.019 + stand * 0.004 + vigor * 0.010
          : j < 3 ? 0.011 + vigor * 0.014 : 0.0055 + vigor * 0.0085)
        const length = baseLength * 1.416
        // One main crest sweeps across the field before the next takes over.
        const gustPhase = center * 5.8 + depth * 0.29
        const ripplePhase = center * 17.2 + depth * 0.55 + vigor * 0.27
        const bladeWidth = pixel * (0.89 + grain(id, 19) * 0.34) + baseLength * 0.025
        this.stems.push(blade(x, y, length, bladeWidth, gustPhase, ripplePhase, id, 0.83))
        top = Math.min(top, y - length)
      }
    }

    // Fill every depth band. Only the light mask, not the planting density, fades toward the viewer.
    const reach = scale * 0.17
    const rows = 7
    const columns = Math.ceil(count * 0.24)
    const cellWidth = width / columns
    const groundFringe = Math.ceil(pad / cellWidth)
    const span = columns + 2 * groundFringe
    for (let row = 0; row < rows; row++) {
      for (let col = -groundFringe; col < columns + groundFringe; col++) {
        const cell = row * span + col
        const center = (col + 0.5 + (grain(cell, 31) - 0.5) * 0.74) / columns
        const depth = row + 0.16 + 0.68 * grain(cell, 37)
        for (let j = 0; j < 3; j++) {
          const id = 8192 + cell * 3 + j
          const z = (depth + (grain(id, 8) - 0.5) * 0.30) / rows
          const spread = (j - 1) * (0.14 + z * 0.12) + (grain(id, 4) - 0.5) * 0.23
          const x = center * width + spread * cellWidth
          const y = edge + reach * z
          const vigor = grain(id, 14)
          const length = Math.min(reach * z, scale * (0.008 + z * 0.034) * (0.38 + vigor * 0.61))
          const bladeWidth = pixel * (0.87 + z * 0.62 + grain(id, 19) * 0.30) + length * 0.027
          this.groundBlades.push(blade(x, y, length, bladeWidth, center * 5.8 + z * 1.21, center * 17.2 + z * 2, id, 0.83 + z * 0.17))
        }
      }
    }

    const scaleY = rasterHeight / height
    const topRow = Math.max(0, Math.floor(top * scaleY) - 2)
    const bottomRow = Math.min(rasterHeight, Math.ceil((edge + reach) * scaleY) + 2)
    this.strip.width = rasterWidth
    this.strip.height = bottomRow - topRow
    this.stripContext.setTransform(rasterWidth / width, 0, 0, scaleY, 0, -topRow)
    this.width = width
    this.bandTop = topRow / scaleY
    this.bandHeight = this.strip.height / scaleY
    this.groundEdge = edge
    this.groundReach = reach
    return bottomRow
  }

  setLightBoundary(top: number, left: number, right: number): void {
    const outerReach = this.groundReach
    const innerReach = Math.max(0, Math.min(outerReach, top - this.groundEdge))
    // Let the light travel farther beside the copy, with no hard edge around it.
    const w = innerReach === outerReach ? 1 : 128
    const h = 64
    const mask = this.groundFalloff
    mask.width = w
    mask.height = h
    const ctx = mask.getContext('2d')!
    const image = ctx.createImageData(w, h)
    const transition = Math.min(130, this.width * 0.13)
    for (let col = 0; col < w; col++) {
      const x = (col + 0.5) * this.width / w
      const distance = Math.max(left - x, x - right, 0)
      const spread = smooth((distance - 12) / transition)
      const reach = innerReach + (outerReach - innerReach) * spread
      if (reach === 0) continue
      for (let row = 0; row < h; row++) {
        const depth = (row + 0.5) * outerReach / (h * reach)
        if (depth >= 1) break
        const remaining = 1 - depth
        const light = 0.70 * remaining * remaining * (1 + 0.55 * depth)
        image.data[(row * w + col) * 4 + 3] = Math.round(light * 255)
      }
    }
    ctx.putImageData(image, 0, 0)
  }

  draw(target: CanvasRenderingContext2D, time: number, elevation: number, camera: number): void {
    if (elevation <= 0.025) return
    const gustTime = time * 0.96, rippleTime = time * 1.58
    const gustSin = Math.sin(gustTime), gustCos = Math.cos(gustTime)
    const rippleSin = Math.sin(rippleTime), rippleCos = Math.cos(rippleTime)
    const ctx = this.stripContext
    ctx.clearRect(0, this.bandTop - 1, this.width, this.bandHeight + 2)
    const groundLight = smooth((elevation - 0.18) / 0.78)
    if (groundLight > 0) {
      ctx.fillStyle = '#fff'
      this.paintBlades(this.groundBlades, gustSin, gustCos, rippleSin, rippleCos, camera)
      ctx.globalCompositeOperation = 'destination-in'
      // The light starts below the sun, then reaches outward and toward the viewer.
      const spread = smooth((elevation - 0.21) / 0.70)
      if (spread < 1) {
        const extent = 0.19 + 3.42 * spread
        const w = this.width * extent
        const h = this.groundReach * extent
        ctx.drawImage(this.dawnLight, (this.width - w) * 0.5 - camera * SUN_DEPTH, this.groundEdge - h, w, h * 2)
      }
      ctx.globalAlpha = groundLight
      ctx.drawImage(this.groundFalloff, 0, this.groundEdge, this.width, this.groundReach)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.fillStyle = '#000'
    this.paintBlades(this.stems, gustSin, gustCos, rippleSin, rippleCos, camera)
    target.globalAlpha = smooth((elevation - 0.025) / 0.25)
    target.drawImage(this.strip, 0, this.bandTop, this.width, this.bandHeight)
    target.globalAlpha = 1
  }

  private paintBlades(stems: readonly Stem[], gustSin: number, gustCos: number, rippleSin: number, rippleCos: number, camera: number): void {
    const ctx = this.stripContext
    ctx.beginPath()
    for (let i = 0; i < stems.length; i++) {
      // Bound path construction cost without compounding dawn opacity where leaves overlap.
      if (i !== 0 && i % 32 === 0) {
        ctx.fill()
        ctx.beginPath()
      }
      const stem = stems[i]
      const { y, width, length } = stem
      const x = stem.x - camera * stem.depth
      const crest = Math.max(0, stem.gustCos * gustCos + stem.gustSin * gustSin)
      const ripple = stem.rippleCos * rippleCos + stem.rippleSin * rippleSin
      const gust = crest * crest * (0.54 + 0.07 * ripple)
      const tilt = stem.lean + stem.flex * (0.09 + 0.035 * ripple + gust)
      const bend = length * tilt
      const tipX = x + bend
      const tipY = y - length + Math.abs(bend) * 0.22
      const curveX = x + bend * stem.arch
      const curveY = y - length * 0.57
      // Shared control height keeps both edges on the same arc instead of ballooning at the bend.
      ctx.moveTo(x - width * 0.5, y)
      ctx.quadraticCurveTo(curveX - width * 0.20, curveY, tipX, tipY)
      ctx.quadraticCurveTo(curveX + width * 0.20, curveY, x + width * 0.5, y)
      ctx.closePath()
    }
    ctx.fill()
  }
}
