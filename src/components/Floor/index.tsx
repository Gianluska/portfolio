import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, MeshStandardMaterial, RepeatWrapping } from "three";

export function Floor() {
  // const [diffuseMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
  //   "/textures/VulcanRock/VulcanRock_Albedo.jpg",
  //   "/textures/VulcanRock/VulcanRock_Normal.jpg", 
  //   "/textures/VulcanRock/VulcanRock_Roughness.jpg" 
  // ]);
  // const [diffuseMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
  //   "/textures/WoodOakVeneer/OakVeneer_Albedo.jpg",
  //   "/textures/WoodOakVeneer/OakVeneer_Normal.jpg", 
  //   "/textures/WoodOakVeneer/OakVeneer_Roughness.jpg" 
  // ]);
  const [diffuseMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
    "/textures/WoodParquet/Parquet_Albedo.jpg",
    "/textures/WoodParquet/Parquet_Normal.jpg", 
    "/textures/WoodParquet/Parquet_Roughness.jpg" 
  ]);
  // const [diffuseMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
  //   "/textures/Herringbone/Herringbone_Albedo.jpg",
  //   "/textures/Herringbone/Herringbone_Normal.jpg", 
  //   "/textures/Herringbone/Herringbone_Roughness.jpg" 
  // ]);
  // const [diffuseMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
  //   "/textures/Medieval/Medieval_Albedo.jpg",
  //   "/textures/Medieval/Medieval_Normal.jpg", 
  //   "/textures/Medieval/Medieval_Roughness.jpg" 
  // ]);

  useMemo(() => {
    // Definindo a textura para repetir
    diffuseMap.wrapS = RepeatWrapping;
    diffuseMap.wrapT = RepeatWrapping;
    normalMap.wrapS = RepeatWrapping;
    normalMap.wrapT = RepeatWrapping;
    roughnessMap.wrapS = RepeatWrapping;
    roughnessMap.wrapT = RepeatWrapping;

    // Ajustando quantas vezes a textura deve repetir
    const repeatFactor = 10; // Defina a quantidade de repetições
    diffuseMap.repeat.set(repeatFactor, repeatFactor);
    normalMap.repeat.set(repeatFactor, repeatFactor);
    roughnessMap.repeat.set(repeatFactor, repeatFactor);
    
    // Atualizando as texturas
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
