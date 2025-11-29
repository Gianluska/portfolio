import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../../stores/useAppStore'

import { SacredGeometry } from './SacredGeometry'
import { LiquidGlassOctahedron } from './LiquidGlassOctahedron'
import { GlowingCore } from './GlowingCore'
import { ConcentricRings } from './ConcentricRings'
import { FloatingFragments } from './FloatingFragments'
import { DiagonalLines } from './DiagonalLines'
import { ScanPlane } from './ScanPlane'
import { VertexPoints } from './VertexPoints'

interface AppState {
  mousePosition: { x: number; y: number }
}

interface UniverseProps {
  scrollOffset?: number
}

export function Universe({ scrollOffset = 0 }: UniverseProps) {
  const mainGroupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const mousePosition = useAppStore((state: AppState) => state.mousePosition)

  // Update camera based on scroll
  useFrame((state) => {
    const elapsed = state.clock.elapsedTime
    const scrollFactor = scrollOffset

    // Main group breathing animation
    if (mainGroupRef.current) {
      const breathe = 1 + Math.sin(elapsed * 0.5) * 0.05
      const scrollScale = 1 + scrollFactor * 0.3
      mainGroupRef.current.scale.setScalar(breathe * scrollScale)
    }

    // Camera subtle movement
    camera.position.x = Math.sin(elapsed * 0.1) * 0.5
    camera.position.y = Math.cos(elapsed * 0.15) * 0.3 - scrollFactor * 2
    camera.position.z = 15 + scrollFactor * 5
    camera.lookAt(0, -scrollFactor * 2, 0)
  })

  return (
    <>
      {/* Main group containing all nested geometries */}
      <group ref={mainGroupRef}>
        <SacredGeometry mousePosition={mousePosition} />
        <LiquidGlassOctahedron mousePosition={mousePosition} />
        <GlowingCore />
        <VertexPoints />
      </group>

      {/* Rings around the main geometry */}
      <ConcentricRings mousePosition={mousePosition} />

      {/* Floating fragments in the background */}
      <FloatingFragments mousePosition={mousePosition} />

      {/* Background diagonal lines */}
      <DiagonalLines />

      {/* Scanning plane */}
      <ScanPlane />
    </>
  )
}
