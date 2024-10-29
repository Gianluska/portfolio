import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Home } from "pages/Home";
import { LoadingScreen } from "pages/Loading";
import { Leva } from "leva";
import { Suspense, useRef } from "react";
import { Vector3 } from "three";
import { OrbitControls, Stats } from "@react-three/drei";

function CameraController() {
  const { camera, pointer } = useThree();

  const initialPosition = useRef(new Vector3(-6, 6.5, 12));
  const movementFactor = 0.5;

  useFrame(() => {
    const x = initialPosition.current.x + pointer.x * movementFactor;
    const y = initialPosition.current.y + pointer.y * movementFactor;

    camera.position.set(x, y, initialPosition.current.z);

    camera.lookAt(0, 1.5, 0);
  });

  return null;
}

function App() {
  return (
    <div className="w-full h-screen">
      <Canvas
        className="bg-black"
        dpr={[1, 2]}
        shadows
        camera={{ position: [0, 5, 15], fov: 60 }}
      >
        {/* <OrbitControls />  */}
        <Suspense fallback={null}>
          <CameraController />
          <Home />
        </Suspense>
      </Canvas>
      <LoadingScreen />
      <Leva hidden />
      <Stats />
    </div>
  );
}

export default App;
