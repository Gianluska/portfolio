import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Perf } from "r3f-perf";
import Player from "./components/Player";
import Bedroom from "./levels/Bedroom";

export default function Experience() {
  return (
    <>
      <Perf position="top-left" />

      <OrbitControls makeDefault />

      <directionalLight position={[-3, 1, 3]} intensity={1} />
      <ambientLight intensity={0.5} />

      <Player />

      <Bedroom />
    </>
  );
}
