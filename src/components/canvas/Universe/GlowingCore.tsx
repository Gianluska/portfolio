import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Import shaders
import glowCoreVert from '../shaders/glowCore.vert'
import glowCoreFrag from '../shaders/glowCore.frag'
import auraFrag from '../shaders/aura.frag'

export function GlowingCore() {
  const coreRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.LineSegments>(null)
  const auraRef = useRef<THREE.Mesh>(null)

  // Create geometries
  const coreGeometry = useMemo(() => new THREE.TetrahedronGeometry(0.7, 0), [])
  const auraGeometry = useMemo(() => new THREE.TetrahedronGeometry(1.0, 0), [])
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(coreGeometry), [coreGeometry])

  // Create core shader material
  const coreShaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlowIntensity: { value: 1.0 },
      },
      vertexShader: glowCoreVert,
      fragmentShader: glowCoreFrag,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Create aura shader material
  const auraShaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: auraFrag,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    // Update uniforms
    coreShaderMaterial.uniforms.uTime.value = elapsed
    auraShaderMaterial.uniforms.uTime.value = elapsed

    if (coreRef.current) {
      coreRef.current.rotation.y = elapsed * 0.4
      coreRef.current.rotation.z = -elapsed * 0.25
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = elapsed * 0.4
      wireframeRef.current.rotation.z = -elapsed * 0.25
    }

    if (auraRef.current) {
      auraRef.current.rotation.y = elapsed * 0.4
      auraRef.current.rotation.z = -elapsed * 0.25
    }
  })

  return (
    <group>
      {/* Glowing core */}
      <mesh ref={coreRef} geometry={coreGeometry} material={coreShaderMaterial} />

      {/* Core wireframe */}
      <lineSegments ref={wireframeRef} geometry={edgesGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </lineSegments>

      {/* Aura glow */}
      <mesh ref={auraRef} geometry={auraGeometry} material={auraShaderMaterial} />
    </group>
  )
}
