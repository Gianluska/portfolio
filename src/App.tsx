import { Canvas } from "@react-three/fiber";
import { Home } from "pages/Home";
import { LoadingScreen } from "pages/Loading";

function App() {
  return (
    <div className="w-full h-screen">
      <Canvas
        className="bg-black"
        dpr={[1, 2]}
        shadows
        camera={{ position: [0, 5, 15], fov: 60 }}
      >
        <Home />
      </Canvas>
      <LoadingScreen />
    </div>
  );
}

export default App;
