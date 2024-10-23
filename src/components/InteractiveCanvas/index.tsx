import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, Vector2 } from "three";
import { vertexShader } from "./shaders/vertexShader";
import { fragmentShader } from "./shaders/fragmentShader";

export function InteractiveCanvas() {
  const meshRef = useRef();
  
  const noiseTexture = useTexture("/noise/blueNoise.png");
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // start from 20 to skip first 20 seconds ( optional )
    meshRef.current.material.uniforms.iTime.value = time + 20;
  });

  const uniforms = useMemo(
    () => ({
      iTime: {
        type: "f",
        value: 1.0,
      },
      iResolution: {
        type: "v2",
        value: new Vector2(4, 3),
      },
      iChannel0: {
        type: "t",
        value: noiseTexture,
      },
    }),
    []
  );

  return (
    <mesh position={[-0.3, 3.8, 0.46]} rotation-x={-0.2} ref={meshRef}>
      <planeGeometry args={[3.3, 4.5]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={DoubleSide}
      />
      {/* <meshStandardMaterial color="hotpink" opacity={1} transparent /> */}
    </mesh>
  );
}