import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function ScanPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(elapsed * 0.5) * 10
    }

    if (materialRef.current) {
      materialRef.current.opacity = 0.05 + Math.abs(Math.sin(elapsed * 0.5)) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[30, 0.05]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
