import { MeshPortalMaterial } from "@react-three/drei";
import PortalParticles from '@components/Sphere/portalParticles';
import MysticFogSphere from '@components/Sphere';

export function InteractiveCanvas() {
  return (
    <mesh position={[-0.3, 3.8, 0.46]} rotation-x={-0.2}>
      <planeGeometry args={[3.3, 4.5]} />
      {/* Portal */}
      <MeshPortalMaterial transparent={true} depthWrite={false} depthTest={false}>
        <ambientLight intensity={0.5} />
        <MysticFogSphere />
      </MeshPortalMaterial>
      {/* Partículas Envolventes */}
      <PortalParticles />
    </mesh>
  );
}
