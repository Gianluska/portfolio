export const HORIZON = 0.39
export const SUN_DEPTH = 0.09
export const PARALLAX_GAIN = 1.15

export const cameraTravel = (width: number): number => Math.min(64, width * 0.045) * PARALLAX_GAIN

export const smooth = (x: number): number => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

export function grain(x: number, y: number): number {
  let bits = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177)
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967296
}
