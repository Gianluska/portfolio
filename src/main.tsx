import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import ReactDOM from "react-dom/client";
import Experience from "./Experience";

import "./globalStyles.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Canvas shadows camera={{ position: [2, 1, 2] }}>
    <Experience />
  </Canvas>
);
