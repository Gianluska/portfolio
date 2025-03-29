import { Box, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useRef } from "react";
import type { Mesh } from "three";

export function Home() {
  const boxRef = useRef<Mesh>(null);
  useFrame(() => {
    if (!boxRef.current) return;
    boxRef.current.rotation.y += 0.002;
  });

  
  return (
    <>
      <OrbitControls />
      <Box ref={boxRef} args={[1, 1, 1]} rotation={[0.5, 0, 0]}>
        <meshNormalMaterial />
      </Box>
      <Noise
        premultiply // enables or disables noise premultiplication
        blendFunction={BlendFunction.ADD} // blend mode
      />
      <ambientLight />
    </>
  )
}