import { DEPTH_CENTER, DEPTH_RANGE, SEA_TILT } from './AsciiPerspective'

/** One ground plane and one fixed drop edge, viewed by a retreating, pitching camera. */
export class AsciiSceneCamera {
  zoom = 1
  tilt = SEA_TILT
  centerY = 0
  perspective = 0
  edgeZ = 0
  lipY = 0
  impactY = 0
  edgeScale = 1

  update(progress: number, height: number): void {
    const t = progress * progress * (3 - 2 * progress)
    this.zoom = 1 - 0.42 * t
    this.tilt = SEA_TILT + (0.1 - SEA_TILT) * t
    this.centerY = height * (0.5 - 0.515 * t)
    this.perspective = DEPTH_RANGE * this.tilt / DEPTH_CENTER * this.zoom
    this.edgeZ = height * 0.92
    this.edgeScale = this.scale(this.edgeZ, height)
    this.lipY = this.projectY(this.edgeZ, height)
    this.impactY = this.lipY + height * 1.4 * Math.sqrt(1 - this.tilt * this.tilt) * this.edgeScale
  }

  worldZ(y: number, height: number): number {
    const dy = y - this.centerY
    return dy / (this.tilt * this.zoom + dy * this.perspective / height)
  }

  inverseSlope(y: number, height: number): number {
    const denominator = this.tilt * this.zoom + (y - this.centerY) * this.perspective / height
    return this.tilt * this.zoom / (denominator * denominator)
  }

  scale(z: number, height: number): number {
    return this.zoom / (1 - this.perspective * z / height)
  }

  projectY(z: number, height: number): number {
    return this.centerY + z * this.tilt * this.scale(z, height)
  }
}
