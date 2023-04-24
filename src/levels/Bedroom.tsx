import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MeshBasicMaterial, MeshToonMaterial } from "three";
import * as THREE from "three";
import { useControls } from "leva";

const Bedroom = () => {
  const Bedroom = useGLTF("./bedroom/bedroom.glb");
  let video = document.querySelector("#video");
  // @ts-ignore
  video.play();
  // @ts-ignore
  let videoTexture = new THREE.VideoTexture(video);

  const { tvWidth, tvHeight, tvPosition } = useControls({
    tvPosition: { x: -1.62, y: 0, z: 3 },
    tvWidth: { value: 1.37 },
    tvHeight: { value: 0.7 },
  });
  0.0;
  useFrame((mesh, delta) => {
    const fan = Bedroom.nodes.Cylinder_16;

    fan.rotateY(-(delta * 10));
  });

  return (
    <>
      <mesh position-y={-1} scale={0.8}>
        <primitive object={Bedroom.scene} />
      </mesh>
      <mesh
        scale={1}
        position={[tvPosition.x, tvPosition.y, tvPosition.z]}
        rotation={[-Math.PI / 2, -Math.PI / 2, -Math.PI / 2]}
      >
        <planeGeometry args={[tvWidth, tvHeight]} />
        <meshBasicMaterial map={videoTexture} side={THREE.FrontSide} />
      </mesh>
    </>
  );
};

export default Bedroom;
