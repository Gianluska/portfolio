import { OrbitControls, useHelper } from "@react-three/drei";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import { useRef } from "react";
import { RectAreaLight } from "three";
import Player from "./components/Player";
import Bedroom from "./levels/Bedroom";

import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper";
import { useFrame } from "@react-three/fiber";

export default function Experience() {
  const rectAreaLightRef = useRef<RectAreaLight>(null!);
  // useHelper(rectAreaLightRef, RectAreaLightHelper, "red");

  const { directLight, rectLight, width, height, intensity } = useControls({
    directLight: { x: -4.3, y: 8.3, z: 3.0 },
    rectLight: { x: -1.6, y: 0, z: 3.0 },
    width: { value: 1.4 },
    height: { value: 0.7 },
    intensity: { value: 30 },
  });

  useFrame((_, delta) => {
    rectAreaLightRef.current.intensity = Math.sin(delta) * 500
  })

  return (
    <>
      <Perf position="top-left" />

      <OrbitControls
        makeDefault
        maxDistance={12}
        minDistance={10}
        minAzimuthAngle={-Math.PI / 2.5}
        maxAzimuthAngle={-Math.PI / 10}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI - Math.PI / 1.8}
      />

      <directionalLight
        position={[directLight.x, directLight.y, directLight.z]}
        intensity={0.2}
      />

      <rectAreaLight
        ref={rectAreaLightRef}
        position={[rectLight.x, rectLight.y, rectLight.z]}
        rotation={[Math.PI / 2, Math.PI / 2, Math.PI / 2]}
        width={width}
        height={height}
        color={"lightblue"}
        intensity={intensity}
      />

      <ambientLight intensity={0.05} />

      <Player />

      <Bedroom />
    </>
  );
}
