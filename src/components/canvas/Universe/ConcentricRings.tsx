import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SCENE_CONFIG } from '../../../lib/constants'

interface ConcentricRingsProps {
  mousePosition: { x: number; y: number }
}

export function ConcentricRings({ mousePosition }: ConcentricRingsProps) {
  const ringsRef = useRef<THREE.Group>(null)

  const rings = useMemo(() => {
    const { count, baseRadius, radiusStep } = SCENE_CONFIG.rings
    return Array.from({ length: count }, (_, i) => ({
      radius: baseRadius + i * radiusStep,
      opacity: 0.15 - i * 0.015,
      rotationSpeed: 0.0003 * (i % 2 === 0 ? 1 : -1),
      index: i,
    }))
  }, [])

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const mesh = ring as THREE.Mesh

        // Rotation
        mesh.rotation.x = Math.PI / 2 + Math.sin(elapsed * 0.2 + i * 0.5) * 0.1
        mesh.rotation.y = elapsed * rings[i].rotationSpeed * 50

        // Pulse effect
        const pulse = 1 + Math.sin(elapsed * 2 + i * 0.3) * 0.02
        mesh.scale.setScalar(pulse)

        // Mouse influence
        mesh.rotation.z = mousePosition.x * 0.1 * (i % 2 === 0 ? 1 : -1)
      })
    }
  })

  return (
    <group ref={ringsRef}>
      {rings.map((ring) => (
        <mesh key={ring.index}>
          <ringGeometry args={[ring.radius, ring.radius + 0.02, 64]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
