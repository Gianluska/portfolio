import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import Player from "./components/Player";
import Bedroom from "./levels/Bedroom";

export default function Experience() {
  return (
    <>
      {/* <Perf position="top-left" /> */}

      <OrbitControls
        makeDefault
        maxDistance={12}
        minDistance={10}
        minAzimuthAngle={-Math.PI / 2.5}
        maxAzimuthAngle={-Math.PI / 10}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI - Math.PI / 1.8}
      />

      <directionalLight position={[-4.3, 8.3, 3.0]} intensity={0.2} />

      <rectAreaLight
        position={[-1.6, 0, 3.0]}
        rotation={[Math.PI / 2, Math.PI / 2, Math.PI / 2]}
        width={1.4}
        height={0.7}
        color={"lightblue"}
        intensity={30}
      />

      <ambientLight intensity={0.05} />

      <Player />

      <Bedroom />
    </>
  );
}
