// Fixed, level view. Tilt is the foreshortening of the ground, not camera pitch.
export const HORIZON = 0.72
export const SEA_TILT = 0.28
const DEPTH_FAR = 0.32
const DEPTH_RANGE = 0.64
export const DEPTH_CENTER = DEPTH_FAR + DEPTH_RANGE * 0.5

export function seaDepth(y: number, height: number): number {
  return Math.max(0, Math.min(1, (y / height - HORIZON) / (1 - HORIZON)))
}

/** Projected size at a screen-space waterline; clamped for actors entering offscreen. */
export function sceneScale(y: number, height: number): number {
  return DEPTH_FAR + DEPTH_RANGE * seaDepth(y, height)
}

/** Inverse ground projection, in reference-plane pixels centred on the drop impact. */
export function seaX(x: number, y: number, width: number, height: number): number {
  return (x - width / 2) * DEPTH_CENTER / sceneScale(y, height)
}

export function impactY(height: number): number {
  return height * (HORIZON + (1 - HORIZON) * 0.58)
}

export function seaZ(y: number, height: number): number {
  return (y - impactY(height)) * DEPTH_CENTER / (sceneScale(y, height) * SEA_TILT)
}

/** Derivative of the inverse vertical projection on the visible water. */
export function seaInverseSlope(y: number, height: number): number {
  const scale = sceneScale(y, height)
  const impactScale = DEPTH_FAR + DEPTH_RANGE * 0.58
  return DEPTH_CENTER * impactScale / (scale * scale * SEA_TILT)
}
