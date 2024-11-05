import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { type AmbientLight, type Group, type SpotLight, Vector2 } from "three";
import { useControls, folder } from "leva";
import { Suspense } from "react";
import { Easel } from "@components/Easel";

// import { Floor } from "@components/Floor";
import { useSpotlightAnimation } from "./useSpotlightAnimation";
import { Dust } from "@components/Dust";
import { Floor } from "@components/NewFloor";
import { InteractiveCanvas } from "@components/InteractiveCanvas";
import { Bloom, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";

export function Home() {
  const spotLightRef = useRef<SpotLight>(null);
  const ambientLightRef = useRef<AmbientLight>(null);
  const targetRef = useRef<Group>(null);

  const { total } = useProgress();
  const isFinished = total <= 13;

  useSpotlightAnimation(spotLightRef, ambientLightRef, isFinished);

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
        {/* <BlackHole /> */}

        {/* <WormholeSphere /> */}
        {/* <MysticFogSphere /> */}
        <InteractiveCanvas />
        <Floor />
        <fog attach="fog" args={["black", 10, 30]} />
        <Dust count={1500} />
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
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        <ChromaticAberration offset={new Vector2(0.001, 0.001)} radialModulation={false} modulationOffset={0} />
      </EffectComposer>
    </>
  );
}
