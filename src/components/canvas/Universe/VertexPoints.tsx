import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function VertexPoints() {
  const groupRef = useRef<THREE.Group>(null)

  // Extract unique vertices from icosahedron
  const vertices = useMemo(() => {
    const icoGeometry = new THREE.IcosahedronGeometry(2.8, 0)
    const positionAttr = icoGeometry.attributes.position
    const uniqueVertices: THREE.Vector3[] = []
    const addedPositions = new Set<string>()

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i)
      const y = positionAttr.getY(i)
      const z = positionAttr.getZ(i)
      const key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`

      if (!addedPositions.has(key)) {
        addedPositions.add(key)
        uniqueVertices.push(new THREE.Vector3(x, y, z))
      }
    }

    return uniqueVertices.map((pos, i) => ({
      position: pos,
      pulseOffset: Math.random() * Math.PI * 2,
      index: i,
    }))
  }, [])

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.05, 8, 8), [])

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    if (groupRef.current) {
      groupRef.current.children.forEach((point, i) => {
        const mesh = point as THREE.Mesh
        const data = vertices[i]
        const pulse = 0.5 + Math.sin(elapsed * 3 + data.pulseOffset) * 0.5

        const material = mesh.material as THREE.MeshBasicMaterial
        material.opacity = pulse
        mesh.scale.setScalar(0.8 + pulse * 0.4)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {vertices.map((vertex) => (
        <mesh
          key={vertex.index}
          geometry={sphereGeometry}
          position={vertex.position}
        >
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}
