import { useGLTF } from "@react-three/drei";
import { useEffect, forwardRef } from "react";
import { type Mesh } from "three";

import { Group } from "three";
import { type ForwardedRef } from "react";

export const Easel = forwardRef<Group, JSX.IntrinsicElements['group']>((props, ref: ForwardedRef<Group>) => {
  const { scene } = useGLTF("/models/easel.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group ref={ref} {...props}>
      <primitive object={scene} />
    </group>
  );
});
