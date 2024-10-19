import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import {type AmbientLight, type Group, type SpotLight } from "three";
import { useControls, folder } from "leva";
import { Suspense } from "react";
import { Easel } from "@components/Easel";

import gsap from "gsap";
import { Floor } from "@components/Floor";
import { useGSAP } from "@gsap/react";

export function Home() {
  const spotLightRef = useRef<SpotLight>(null);
  const ambientLightRef = useRef<AmbientLight>(null);
  const targetRef = useRef<Group>(null);

  const { total } = useProgress();
  const isFinished = total === 11;

  useGSAP(() => {
    if (isFinished) {
      const INTRO_DURATION = 2.5;

      setTimeout(() => {
        if (spotLightRef.current && ambientLightRef.current) {
          gsap.to(spotLightRef.current, {
            duration: 0.1,
            ease: "power2.inOut",
            delay: 3,
            intensity: 3.1,
          });

          gsap.to(spotLightRef.current, {
            duration: 0.1,
            ease: "power2.inOut",
            delay: 3.1,
            intensity: 0,
          });

          gsap.to(spotLightRef.current, {
            duration: 0.1,
            ease: "power2.inOut",
            delay: 3.2,
            intensity: 3.1,
          });


          gsap.to(spotLightRef.current, {
            duration: 0.1,
            ease: "power2.inOut",
            delay: 3.3,
            intensity: 0,
          });

          gsap.to(spotLightRef.current, {
            duration: 2,
            ease: "power2.inOut",
            delay: 3.65,
            intensity: 3.1, 
          });
          gsap.to(ambientLightRef.current, {
            duration: 2,
            ease: "power2.inOut",
            delay: 3.65,
            intensity: 0.1,
          });
        }
      }, INTRO_DURATION * 1000);

    }
  }, [isFinished])

  const {
    positionX,
    positionY,
    positionZ,
    targetX,
    targetY,
    targetZ,
    intensity,
    angle,
    penumbra,
    decay,
    distance,
  } = useControls("SpotLight Controls", {
    Position: folder({
      positionX: { value: 3.8, min: -20, max: 20, step: 0.1 },
      positionY: { value: 12.1, min: 0, max: 20, step: 0.1 },
      positionZ: { value: 7.3, min: -20, max: 20, step: 0.1 },
    }),
    Target: folder({
      targetX: { value: -3.3, min: -10, max: 10, step: 0.1 },
      targetY: { value: -5.4, min: -10, max: 10, step: 0.1 },
      targetZ: { value: -10.0, min: -10, max: 10, step: 0.1 },
    }),
    "Light Properties": folder({
      intensity: { value: 0, min: 0, max: 10, step: 0.1 },
      angle: { value: Math.PI / 8, min: 0, max: Math.PI / 2, step: 0.01 },
      penumbra: { value: 0.71, min: 0, max: 1, step: 0.01 },
      decay: { value: 0, min: 0, max: 5, step: 0.1 },
      distance: { value: 22, min: 0, max: 100, step: 1 },
    }),
  });

  useFrame(() => {
    if (spotLightRef.current) {
      spotLightRef.current.target.position.set(targetX, targetY, targetZ);
    }
  });

  // Opcional: Visualizar o holofote
  // useHelper(spotLightRef, SpotLightHelper, "cyan");

  return (
    <>
      <Suspense fallback={null}>
        <Easel ref={targetRef} />
        <Floor />
        <fog attach="fog" args={['black', 10, 30]} />
      </Suspense>
      <ambientLight ref={ambientLightRef} intensity={0} />
      <spotLight
        ref={spotLightRef}
        position={[positionX, positionY, positionZ]}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        decay={decay}
        distance={distance}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00005}
      />
    </>
  );
}
