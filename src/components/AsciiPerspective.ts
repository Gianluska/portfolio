// A pitched camera with its vanishing line above the viewport: water stays full-bleed.
export const SEA_TILT = 0.55
export const DEPTH_FAR = 0.3
export const DEPTH_RANGE = 0.8
export const DEPTH_CENTER = DEPTH_FAR + DEPTH_RANGE * 0.5

/** Projected size at a screen-space waterline; clamped for actors entering offscreen. */
export function sceneScale(y: number, height: number): number {
  return DEPTH_FAR + DEPTH_RANGE * Math.max(0, Math.min(1, y / Math.max(1, height)))
}

/** Inverse ground projection, in reference-plane pixels centred on the drop impact. */
export function seaX(x: number, y: number, width: number, height: number): number {
  return (x - width / 2) * DEPTH_CENTER / sceneScale(y, height)
}

export function seaZ(y: number, height: number): number {
  return (y - height / 2) * DEPTH_CENTER / (sceneScale(y, height) * SEA_TILT)
}
