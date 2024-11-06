import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Points } from "three";

export function BlackHoleParticles() {
  const particlesRef = useRef<Points>(null);

  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.random() * 0.5;
      positions[i * 3] = radius * Math.cos(angle);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = radius * Math.sin(angle);
      speeds[i] = 0.01 + Math.random() * 0.02;
    }

    return { positions, speeds };
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;
      const speeds = particlesRef.current.userData.speeds as Float32Array;

      for (let i = 0; i < positions.length / 3; i++) {
        const ix = i * 3;
        const iz = i * 3 + 2;

        const radius = Math.sqrt(
          positions[ix] * positions[ix] + positions[iz] * positions[iz]
        );
        const angle = Math.atan2(positions[iz], positions[ix]) + speeds[i];

        positions[ix] = radius * Math.cos(angle);
        positions[iz] = radius * Math.sin(angle);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} userData={{ speeds: particles.speeds }}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particles.positions}
          count={particles.positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#cfcfcf" />
    </points>
  );
}
