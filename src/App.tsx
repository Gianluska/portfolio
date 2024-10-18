import { Canvas, useThree } from "@react-three/fiber";
import { Home } from "pages/Home";
import { LoadingScreen } from "pages/Loading";
import { Leva, useControls } from "leva";
import { Suspense, useEffect } from "react";
import { MathUtils } from "three";

function CameraController() {
  const { camera } = useThree();

  const {
    x,
    y,
    z,
    rotationX,
    rotationY,
    rotationZ,
  } = useControls("Camera Controls", {
    x: { value: -6.3, min: -20, max: 20, step: 0.1 },
    y: { value: 2.8, min: -20, max: 20, step: 0.1 },
    z: { value: 11.7, min: -20, max: 20, step: 0.1 },
    rotationX: { value: 0, min: -180, max: 180, step: 1 },
    rotationY: { value: -26, min: -180, max: 180, step: 1 },
    rotationZ: { value: 0, min: -180, max: 180, step: 1 },
  });

  useEffect(() => {
    camera.position.set(x, y, z);
    camera.rotation.set(
      MathUtils.degToRad(rotationX),
      MathUtils.degToRad(rotationY),
      MathUtils.degToRad(rotationZ)
    );
  }, [x, y, z, rotationX, rotationY, rotationZ, camera]);

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
        <Suspense fallback={null}>
          <CameraController />
          <Home />
        </Suspense>
      </Canvas>
      <LoadingScreen />
      <Leva hidden />
    </div>
  );
}

export default App;
