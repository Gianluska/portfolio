import { useRef } from "react";
import { Mesh } from "three";

export function InteractiveCanvas() {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef} position={[-0.3, 3.8, 0.46]} rotation-x={-0.2}>
      <planeGeometry args={[3.3, 4.5]} />

      {/* @ts-expect-error - Custom Material */}
      <interactiveShaderMaterial />
    </mesh>
  );
}
