import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import ReactDOM from "react-dom/client";
import Experience from "./Experience";

import "./globalStyles.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <video
      id="video"
      playsInline
      loop
      autoPlay
      width={1290}
      height={1040}
      muted
      src={"/video.mp4"}
      style={{ display: "none" }}
    ></video>
    <Canvas shadows camera={{ zoom: 0.002, position: [-5, 5, 10], fov: 0.1 }}>
      <Experience />
    </Canvas>
  </>
);
