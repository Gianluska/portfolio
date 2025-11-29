import { useMemo } from 'react'
import * as THREE from 'three'

export function DiagonalLines() {
  const lines = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI
      const length = 25

      const points = [
        new THREE.Vector3(
          -length * Math.cos(angle),
          -length * Math.sin(angle),
          -5
        ),
        new THREE.Vector3(
          length * Math.cos(angle),
          length * Math.sin(angle),
          -5
        ),
      ]

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({
        color: 0x222222,
        transparent: true,
        opacity: 0.5,
      })
      const line = new THREE.Line(geometry, material)
      return line
    })
  }, [])

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
}
