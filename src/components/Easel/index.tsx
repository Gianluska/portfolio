// Easel.tsx
import { useGLTF } from "@react-three/drei";
import { useEffect, forwardRef } from "react";
import { Mesh, MeshStandardMaterial, Color, Group, Material, Vector2, TextureLoader } from "three";
import { type ForwardedRef } from "react";
import { useLoader } from "@react-three/fiber";

export const Easel = forwardRef<Group, JSX.IntrinsicElements['group']>((props, ref: ForwardedRef<Group>) => {
  const { scene } = useGLTF("/models/easel.glb");

  const [normalMap] = useLoader(TextureLoader, [
    "/textures/normalMap.png", 
  ]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        materials.forEach((material: Material) => {
          if (material instanceof MeshStandardMaterial) {
            
            if (material.name === "Canvas") {
              material.color = new Color(0xd9d9d9);
              material.normalScale = new Vector2(2, 2);
            } else {
              console.log(material.map)
              material.normalMap = normalMap;
              material.color = new Color(0x9c9c9c);
              material.normalScale = new Vector2(0.1, 0.1);
            }
            
            material.map = null;
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [scene, normalMap]);

  return (
    <group ref={ref} {...props}>
      <primitive object={scene} />
    </group>
  );
});
