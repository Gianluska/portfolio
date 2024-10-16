import { Easel } from "@components/Easel";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

export function Home() {
  return (
    <>
      <OrbitControls />
      <Suspense fallback={null}>
        <Easel />
      </Suspense>
      <ambientLight intensity={1} />
    </>
  );
}
