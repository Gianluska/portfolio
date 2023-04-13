// @ts-nocheck

"use client"

import * as THREE from "three";

import { Physics, useSphere } from "@react-three/cannon";
import {
  Sky,
  useTexture
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

// import Cross from '../../../public/cross.jpg'

const rfs = THREE.MathUtils.randFloatSpread;
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const baubleMaterial = new THREE.MeshStandardMaterial({
  color: "#000",
  roughness: 100,
  envMapIntensity: 0,
});

export const Intro = () => (
  <Canvas
    shadows
    dpr={[1, 2]}
    camera={{ position: [0, 0, 20], fov: 35, near: 1, far: 40 }}
  >
    <spotLight
      intensity={1}
      angle={0.2}
      penumbra={1}
      position={[30, 30, 30]}
      castShadow
      shadow-mapSize={[128, 128]}
    />
    <directionalLight intensity={2} position={[-10, -10, -10]} color="#8906bd" />
    <Physics gravity={[0, 2, 0]} iterations={10}>
      <Pointer />
      <Clump />
    </Physics>
  </Canvas>
);

function Clump({
  mat = new THREE.Matrix4(),
  vec = new THREE.Vector3(),
  ...props
}) {
  const [ref, api] = useSphere(() => ({
    args: [1],
    mass: 3,
    angularDamping: 0.1,
    linearDamping: 0.65,
    position: [rfs(20), rfs(20), rfs(20)],
  }));
  useFrame((state) => {
    for (let i = 0; i < 35; i++) {
      // Get current whereabouts of the instanced sphere
      ref?.current?.getMatrixAt(i, mat);
      // Normalize the position and multiply by a negative force.
      // This is enough to drive it towards the center-point.
      api
        .at(i)
        .applyForce(
          vec
            .setFromMatrixPosition(mat)
            .normalize()
            .multiplyScalar(-50)
            .toArray(),
          [0, 0, 0]
        );
    }
  });
  return (
    <instancedMesh
      ref={ref}
      castShadow
      receiveShadow
      args={[null, null, 35]}
      geometry={sphereGeometry}
      material={baubleMaterial}
    />
  );
}

function Pointer() {
  const viewport = useThree((state) => state.viewport);
  const [, api] = useSphere(() => ({
    type: "Kinematic",
    args: [3],
    position: [0, 0, 0],
  }));
  return useFrame((state) =>
    api.position.set(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    )
  );
}
