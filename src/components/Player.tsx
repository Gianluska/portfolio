import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { useControls } from "leva";

const Player = () => {
  const player = useGLTF("./character.glb");
  const { position, rotation } = useControls({
    position: { x: -4.3, y: -0.6, z: 3.0 },
    rotation: { x: 1.5, y: 0.68, z: 0.74 },
  });

  const { actions } = useAnimations(player.animations, player.scene);

  actions["Laying"]?.play();

  return (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[
        -Math.PI / rotation.x,
        -Math.PI / rotation.y,
        -Math.PI / rotation.z,
      ]}
      scale={1}
    >
      <primitive object={player.scene} />
    </mesh>
  );
};

export default Player;
