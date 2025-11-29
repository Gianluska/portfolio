import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Import shaders
import liquidGlassVert from '../shaders/liquidGlass.vert'
import liquidGlassFrag from '../shaders/liquidGlass.frag'

interface LiquidGlassOctahedronProps {
  mousePosition: { x: number; y: number }
}

export function LiquidGlassOctahedron({ mousePosition }: LiquidGlassOctahedronProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.LineSegments>(null)

  // Create shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader: liquidGlassVert,
      fragmentShader: liquidGlassFrag,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Create geometries
  const glassGeometry = useMemo(() => new THREE.OctahedronGeometry(1.8, 0), [])
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(glassGeometry), [glassGeometry])

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    // Update uniforms
    shaderMaterial.uniforms.uTime.value = elapsed
    shaderMaterial.uniforms.uMouse.value.set(mousePosition.x, mousePosition.y)

    if (meshRef.current) {
      meshRef.current.rotation.x = -elapsed * 0.25
      meshRef.current.rotation.y = elapsed * 0.18
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.x = -elapsed * 0.25
      wireframeRef.current.rotation.y = elapsed * 0.18
    }
  })

  return (
    <group>
      {/* Main liquid glass mesh */}
      <mesh ref={meshRef} geometry={glassGeometry} material={shaderMaterial} />

      {/* Wireframe overlay for definition */}
      <lineSegments ref={wireframeRef} geometry={edgesGeometry}>
        <lineBasicMaterial color="#666688" transparent opacity={0.3} />
      </lineSegments>
    </group>
  )
}
