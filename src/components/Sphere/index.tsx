import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial } from "three";

export function Sphere() {
  const materialRef = useRef<MeshStandardMaterial & { uniforms: { uTime: { value: number } } }>(null!);

  useFrame(({ clock }) => {
    if (materialRef?.current?.uniforms?.uTime) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        metalness={1}
        roughness={0}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = { value: 0 };

          shader.vertexShader = `
            uniform float uTime;
            ${shader.vertexShader}
          `;

          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
              #include <begin_vertex>
              transformed.y += sin(position.x * 10.0 + uTime) * 0.1;
            `
          );

          materialRef.current.uniforms = shader.uniforms;
        }}
      />
    </mesh>
  );
}
