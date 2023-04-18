import { Canvas } from "@react-three/fiber";

import './_home.scss'

function Home() {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
    </Canvas>
  );
}

export default Home;
