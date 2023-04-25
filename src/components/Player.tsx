import { useAnimations, useGLTF } from "@react-three/drei";
import { useControls } from "leva";

const Player = () => {
  const player = useGLTF("./character.glb");

  const { actions } = useAnimations(player.animations, player.scene);

  actions["Laying"]?.play();

  return (
    <mesh
      position={[-4.3, -0.6, 3.0]}
      rotation={[-Math.PI / 1.5, -Math.PI / 0.68, -Math.PI / 0.74]}
      scale={1}
      onPointerOver={() => console.log("HOVER!")}
    >
      <primitive object={player.scene} />
    </mesh>
  );
};

export default Player;
