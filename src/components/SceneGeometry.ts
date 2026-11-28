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

export const SUN_AT_REST = 0.15
export const sunRadius = (width: number, height: number): number => Math.min(width * 0.105, height * 0.098)

/** Height of the Earth's limb at the center of the frame once the camera rests in orbit. */
export const ORBIT_LIMB = 0.80
const LIMB_AT_LIFTOFF = 0.3465

/** Parabolic bulge of the limb toward the edges of the frame. */
export const limbCurve = (width: number, height: number): number => Math.min(0.34, 0.12 + width / height * 0.09)

/** The limb's center line and the depth of its cached raster at a given altitude. */
export function limbAt(altitude: number, height: number): { rim: number, depth: number } {
  return {
    rim: height * (LIMB_AT_LIFTOFF + (ORBIT_LIMB - LIMB_AT_LIFTOFF) * altitude),
    depth: height * (0.66 - 0.11 * smooth((altitude - 0.45) / 0.55)),
  }
}
