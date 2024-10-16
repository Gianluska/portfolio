import { useGLTF } from "@react-three/drei";

export function Easel() {
  const { scene } = useGLTF('/models/easel.glb');

  return (
    <group>
      <primitive object={scene} />
    </group>
  );
}