import { MeshPortalMaterial } from "@react-three/drei";
import { BlackHoleSphere } from "@components/BlackHoleSphere";
import { BlackHoleParticles } from "@components/BlackHoleParticles";

export function InteractiveCanvas() {
  return (
    <mesh position={[-0.3, 3.8, 0.46]} rotation-x={-0.2}>
      <planeGeometry args={[3.3, 4.5]} />
      <MeshPortalMaterial
        transparent={true}
      >
        <ambientLight intensity={0.5} />
        <BlackHoleSphere />
      </MeshPortalMaterial>
      <BlackHoleParticles />
    </mesh>
  );
}
