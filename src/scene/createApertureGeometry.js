import { ExtrudeGeometry, Path, Shape } from 'three'

// A thin machined frame, not a torus primitive. Each instance is a cross-section
// of the bent aperture; the sequence of sections defines the complete volume.
export function createApertureGeometry() {
  const frame = new Shape()
  const hole = new Path()
  const segments = 72

  function contour(path, radiusX, radiusY, reverse) {
    for (let index = 0; index <= segments; index += 1) {
      const angle = (reverse ? -1 : 1) * index / segments * Math.PI * 2
      const cosine = Math.cos(angle)
      const sine = Math.sin(angle)
      const x = Math.sign(cosine) * Math.abs(cosine) ** 0.48 * radiusX
      const y = Math.sign(sine) * Math.abs(sine) ** 0.48 * radiusY
      if (index === 0) path.moveTo(x, y)
      else path.lineTo(x, y)
    }
    path.closePath()
  }

  contour(frame, 2.48, 2.12, false)
  contour(hole, 2.24, 1.88, true)
  frame.holes.push(hole)

  const geometry = new ExtrudeGeometry(frame, {
    depth: 0.048,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.019,
    bevelThickness: 0.019,
    curveSegments: 1,
  })
  geometry.translate(0, 0, -0.024)
  geometry.computeBoundingSphere()
  return geometry
}
