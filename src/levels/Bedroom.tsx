import { useGLTF } from "@react-three/drei";
import { MeshToonMaterial } from "three";

const Bedroom = () => {
  const Bedroom = useGLTF("./bedroom/bedroom.glb");

  return (
    <mesh position-y={-1} scale={0.8}>
      <primitive object={Bedroom.scene} />
    </mesh>
  );
};

export default Bedroom;
