import { useGLTF, useHelper } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  MeshBasicMaterial,
  MeshToonMaterial,
  PointLightHelper,
  SpotLight,
  SpotLightHelper,
  Vector3,
} from "three";
import * as THREE from "three";
import { useControls } from "leva";
import { useRef } from "react";

const Bedroom = () => {
  const Bedroom = useGLTF("./bedroom/bedroom.glb");

  let video = document.querySelector("#video");
  // @ts-ignore
  video.play();
  // @ts-ignore
  let videoTexture = new THREE.VideoTexture(video);

  useFrame((mesh, delta) => {
    const fan = Bedroom.nodes.Fan;

    fan.rotateY(-(delta * 10));
  });

  return (
    <>
      <mesh position-y={-1} scale={0.8}>
        <primitive
          object={Bedroom.scene}
          onClick={(event: any) => {
            console.log(event.object);
            event.stopPropagation();
          }}
        />
      </mesh>
      <mesh
        scale={1}
        position={[-1.62, 0, 3]}
        rotation={[-Math.PI / 2, -Math.PI / 2, -Math.PI / 2]}
      >
        <planeGeometry args={[1.37, 0.7]} />
        <meshBasicMaterial map={videoTexture} side={THREE.FrontSide} />
      </mesh>
    </>
  );
};

export default Bedroom;
