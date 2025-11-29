import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SCENE_CONFIG } from '../../../lib/constants'

interface FragmentData {
  position: THREE.Vector3
  rotationSpeed: { x: number; y: number; z: number }
  floatSpeed: number
  floatOffset: number
  orbitSpeed: number
  opacity: number
  shapeType: number
}

interface FloatingFragmentsProps {
  mousePosition: { x: number; y: number }
}

export function FloatingFragments({ mousePosition }: FloatingFragmentsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  // Generate fragment data
  const fragmentsData = useMemo<FragmentData[]>(() => {
    const { count, minRadius, maxRadius } = SCENE_CONFIG.fragments

    return Array.from({ length: count }, () => {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = minRadius + Math.random() * (maxRadius - minRadius)

      return {
        position: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi) - 5
        ),
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        },
        floatSpeed: 0.5 + Math.random() * 0.5,
        floatOffset: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() - 0.5) * 0.001,
        opacity: 0.2 + Math.random() * 0.3,
        shapeType: Math.floor(Math.random() * 4),
      }
    })
  }, [])

  // Create geometries
  const geometries = useMemo(() => {
    const tetra = new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(0.3, 0))
    const octa = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.25, 0))
    const ico = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.2, 0))
    const box = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.3, 0.3))
    return [tetra, octa, ico, box]
  }, [])

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    if (groupRef.current) {
      groupRef.current.children.forEach((fragment, i) => {
        const data = fragmentsData[i]
        const mesh = fragment as THREE.LineSegments

        // Orbit around center
        const orbitAngle = elapsed * data.orbitSpeed
        const originalPos = data.position

        mesh.position.x =
          originalPos.x * Math.cos(orbitAngle) -
          originalPos.y * Math.sin(orbitAngle)
        mesh.position.y =
          originalPos.x * Math.sin(orbitAngle) +
          originalPos.y * Math.cos(orbitAngle)

        // Float up and down
        mesh.position.z =
          originalPos.z +
          Math.sin(elapsed * data.floatSpeed + data.floatOffset) * 0.5

        // Self rotation
        mesh.rotation.x += data.rotationSpeed.x
        mesh.rotation.y += data.rotationSpeed.y
        mesh.rotation.z += data.rotationSpeed.z

        // Opacity based on distance to mouse (projected)
        const screenPos = mesh.position.clone().project(camera)
        const dist = Math.sqrt(
          Math.pow(screenPos.x - mousePosition.x, 2) +
            Math.pow(screenPos.y - mousePosition.y, 2)
        )

        const material = mesh.material as THREE.LineBasicMaterial
        material.opacity = Math.max(0.1, 0.5 - dist * 0.3)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {fragmentsData.map((data, i) => (
        <lineSegments
          key={i}
          geometry={geometries[data.shapeType]}
          position={data.position}
        >
          <lineBasicMaterial
            color="#ffffff"
            transparent
            opacity={data.opacity}
          />
        </lineSegments>
      ))}
    </group>
  )
}
