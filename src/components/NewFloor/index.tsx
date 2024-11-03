import { Reflector, useTexture } from "@react-three/drei";

export function Floor() {
  const [floor, normal] = useTexture([
    "/textures/Floor/Floor_Texture.jpg",
    "/textures/Floor/Floor_Normal.jpg",
  ]);

  return (
    <Reflector
      blur={[400, 100]}
      resolution={2048}
      args={[20, 20]}
      mirror={0.0}
      mixBlur={10}
      mixStrength={0.5}
      rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      position={[0, -0.95, 0]}
    >
      {(Material, props) => (
        <Material
          color="#686868"
          metalness={0.5}
          roughnessMap={floor}
          normalMap={normal}
          normalScale={[2, 2]}
          {...props}
        />
      )}
    </Reflector>
  );
}
