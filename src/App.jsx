import { Canvas } from '@react-three/fiber'

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      frameloop="demand"
      dpr={[1, 2]}
      role="img"
      aria-label="Um cubo no centro da tela"
    >
      <color attach="background" args={['#181818']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <mesh rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </Canvas>
  )
}
