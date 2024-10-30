import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, MeshStandardMaterial, RepeatWrapping } from "three";

export function Floor() {
  const [ normalMap, roughnessMap] = useLoader(TextureLoader, [
    "/textures/WoodParquet/Parquet_Normal.jpg", 
    "/textures/WoodParquet/Parquet_Roughness.jpg" 
  ]);

  useMemo(() => {
    // normalMap.wrapS = RepeatWrapping;
    // normalMap.wrapT = RepeatWrapping;
    // roughnessMap.wrapS = RepeatWrapping;
    // roughnessMap.wrapT = RepeatWrapping;

    const repeatFactor = 10;
    normalMap.repeat.set(repeatFactor, repeatFactor);
    roughnessMap.repeat.set(repeatFactor, repeatFactor);
    
    normalMap.needsUpdate = true;
    roughnessMap.needsUpdate = true;
  }, [normalMap, roughnessMap]);

  const floorMaterial = useMemo(
    () => {
      const material = new MeshStandardMaterial({
        color: 0x636363,
        normalMap: normalMap, 
        roughnessMap: roughnessMap,
      });

      material.normalScale.set(2, 2);
      return material;
    },
    [normalMap, roughnessMap]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <primitive attach="material" object={floorMaterial} />
    </mesh>
  );
}
