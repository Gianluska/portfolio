import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Perf } from "r3f-perf";
import Player from "./components/Player";

export default function Experience() {
  return (
    <>
      <Perf position="top-left" />

      <directionalLight castShadow position={[0, 10, 10]} intensity={1.5} />
      <ambientLight intensity={0.5} />

      <Player />

      <mesh
        receiveShadow
        position-y={-1}
        rotation-x={Math.PI * -0.5}
        scale={10}
      >
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color={"#458745"} />
      </mesh>
    </>
  );
}
