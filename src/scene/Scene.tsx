import { Canvas } from '@react-three/fiber'
import { Pipeline } from './Pipeline'
import { CAM_Z, FOV, targetDpr, type Stage } from './store'

/** Canvas WebGL da página. Carregado sob demanda enquanto o loader roda. */
export default function SceneCanvas({ onReady }: { onReady: (stage: Stage) => void }) {
  return (
    <Canvas
      flat
      dpr={targetDpr(window.innerWidth, window.innerHeight, 1)}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, CAM_Z] }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.autoClear = false
        gl.setClearColor(0x000000, 0)
      }}
      style={{ pointerEvents: 'none' }}
    >
      <Pipeline onReady={onReady} />
    </Canvas>
  )
}
