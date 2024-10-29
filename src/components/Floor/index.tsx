import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, MeshStandardMaterial, RepeatWrapping } from "three";

export function Floor() {
  const [diffuseMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
    "/textures/WoodParquet/Parquet_Albedo.jpg",
    "/textures/WoodParquet/Parquet_Normal.jpg", 
    "/textures/WoodParquet/Parquet_Roughness.jpg" 
  ]);

  useMemo(() => {
    diffuseMap.wrapS = RepeatWrapping;
    diffuseMap.wrapT = RepeatWrapping;
    normalMap.wrapS = RepeatWrapping;
    normalMap.wrapT = RepeatWrapping;
    roughnessMap.wrapS = RepeatWrapping;
    roughnessMap.wrapT = RepeatWrapping;

    const repeatFactor = 10;
    diffuseMap.repeat.set(repeatFactor, repeatFactor);
    normalMap.repeat.set(repeatFactor, repeatFactor);
    roughnessMap.repeat.set(repeatFactor, repeatFactor);
    
    diffuseMap.needsUpdate = true;
    normalMap.needsUpdate = true;
    roughnessMap.needsUpdate = true;
  }, [diffuseMap, normalMap, roughnessMap]);

  const floorMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        map: diffuseMap, 
        normalMap: normalMap, 
        roughnessMap: roughnessMap,
      }),
    [diffuseMap, normalMap, roughnessMap]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <primitive attach="material" object={floorMaterial} />
    </mesh>
  );
}
