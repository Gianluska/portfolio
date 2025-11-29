import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SacredGeometryProps {
  mousePosition: { x: number; y: number }
}

export function SacredGeometry({ mousePosition }: SacredGeometryProps) {
  const dodecahedronRef = useRef<THREE.LineSegments>(null)
  const icosahedronRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Create geometries once
  const dodecaGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(4, 0)
    return new THREE.EdgesGeometry(geo)
  }, [])

  const icoGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2.8, 0)
    return new THREE.EdgesGeometry(geo)
  }, [])

  // Animation
  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    if (groupRef.current) {
      // Smooth rotation follow mouse
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mousePosition.y * 0.3 + elapsed * 0.1,
        0.03
      )
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mousePosition.x * 0.5 + elapsed * 0.15,
        0.03
      )
    }

    if (dodecahedronRef.current) {
      dodecahedronRef.current.rotation.x = elapsed * 0.05
      dodecahedronRef.current.rotation.y = -elapsed * 0.08
    }

    if (icosahedronRef.current) {
      icosahedronRef.current.rotation.x = elapsed * 0.2
      icosahedronRef.current.rotation.z = elapsed * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Outer Dodecahedron */}
      <lineSegments ref={dodecahedronRef} geometry={dodecaGeometry}>
        <lineBasicMaterial color="#444444" transparent opacity={0.4} />
      </lineSegments>

      {/* Inner Icosahedron */}
      <lineSegments ref={icosahedronRef} geometry={icoGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </lineSegments>
    </group>
  )
}
