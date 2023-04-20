// @ts-nocheck

import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useInput } from "../hooks/useInput";
import * as THREE from "three";

let walkDirection = new THREE.Vector3();
let rotateAngle = new THREE.Vector3(0, 1, 0);
let rotateQuaternion = new THREE.Quaternion();
let cameraTarget = new THREE.Vector3();

const directionOffset = ({ forward, backward, left, right }) => {
  let directionalOffset = 0; //w

  if (forward) {
    if (left) {
      directionalOffset = Math.PI / 4; // w+a
    } else if (right) {
      directionalOffset = -Math.PI / 4; // w+d
    }
  } else if (backward) {
    if (left) {
      directionalOffset = Math.PI / 4 + Math.PI / 2; // s+a
    } else if (right) {
      directionalOffset = -Math.PI / 4 - Math.PI / 2; // s+d
    } else {
      directionalOffset = Math.PI; // s
    }
  } else if (left) {
    directionalOffset = Math.PI / 2; // a
  } else if (right) {
    directionalOffset = -Math.PI / 2; // d
  }

  return directionalOffset;
};

const Player = () => {
  const { backward, forward, jump, left, right, shift } = useInput();

  const player = useGLTF("./character.glb");

  const { actions } = useAnimations(player.animations, player.scene);

  const currentAction = useRef("");
  const controlsRef = useRef<typeof OrbitControls>();
  const camera = useThree((state) => state.camera);

  const updateCameraTarget = (moveX: number, moveZ: number) => {
    camera.position.x += moveX;
    camera.position.z += moveZ;

    cameraTarget.x = player.scene.position.x;
    cameraTarget.y = player.scene.position.y;
    cameraTarget.z = player.scene.position.z;
    if (controlsRef.current) {
      controlsRef.current.target = cameraTarget;
    }
  };

  useEffect(() => {
    let action = "";

    if (forward || backward || left || right) {
      action = "Walk";
    } else {
      action = "Idle";
    }

    if (currentAction.current != action) {
      const nextActionToPlay = actions[action];
      const current = actions[currentAction.current];
      current?.fadeOut(0.5);
      nextActionToPlay?.reset().fadeIn(0.5).play();
      currentAction.current = action;
    }
  }, [backward, forward, jump, left, right, shift]);

  useFrame((state, delta) => {
    if (currentAction.current === "Walk") {
      let angleYCameraDirection = Math.atan2(
        camera.position.x - player.scene.position.x,
        camera.position.y - player.scene.position.y
      );

      let newDirectionOffset = directionOffset({
        forward,
        backward,
        left,
        right,
      });

      rotateQuaternion.setFromAxisAngle(
        rotateAngle,
        angleYCameraDirection + newDirectionOffset
      );
      player.scene.quaternion.rotateTowards(rotateQuaternion, 0.09);

      camera.getWorldDirection(walkDirection);
      walkDirection.y = 0;
      walkDirection.normalize();
      walkDirection.applyAxisAngle(rotateAngle, newDirectionOffset);

      const velocity = 5;

      const moveX = walkDirection.x * velocity * delta;
      const moveZ = walkDirection.z * velocity * delta;

      player.scene.position.x += moveX;
      player.scene.position.z += moveZ;
      updateCameraTarget(moveX, moveZ);
    }
  });

  return (
    <mesh position-y={-1} scale={0.8} castShadow>
      <OrbitControls
        makeDefault
        enableZoom={false}
        enableRotate={false}
        ref={controlsRef}
      />
      <primitive object={player.scene} />
    </mesh>
  );
};

export default Player;
