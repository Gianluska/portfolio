import React, { useRef, useMemo } from 'react';


import { extend, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { AdditiveBlending, type BufferAttribute, type Points, type ShaderMaterial } from 'three';

const DustMaterial = shaderMaterial(
  { time: 0 },
  `
    uniform float time;
    attribute float size;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      float sizeFactor = 0.15;
      gl_PointSize = size * sizeFactor * ( 300.0 / -mvPosition.z );
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  `
    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
      float intensity = 1.0 - smoothstep(0.0, 0.5, dist);

      intensity = pow(intensity, 1.0);

      vec3 color = vec3(1.0, 1.0, 1.0);

      gl_FragColor = vec4(color * intensity, 0.1);
    }
  `
);

extend({ DustMaterial });

interface DustProps {
  count?: number;
}

export const Dust: React.FC<DustProps> = ({ count = 1000 }) => {
  const mesh = useRef<Points>(null!);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 50; // X
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30; // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // Z
      sizes[i] = Math.random() * 2.0 + 1.0;
    }

    return {
      positions,
      sizes,
    };
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (mesh.current) {
      (mesh.current.material as ShaderMaterial).uniforms.time.value = time;

      mesh.current.rotation.y = time * 0.05;

      const positionAttribute = mesh.current.geometry.getAttribute('position') as BufferAttribute;
      if (positionAttribute) {
        const positionsArray = positionAttribute.array as Float32Array;
        for (let i = 0; i < count; i++) {
          positionsArray[i * 3 + 1] += Math.sin(time + i) * 0.001;
        }
        positionAttribute.needsUpdate = true;
      }
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          itemSize={3}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          itemSize={1}
          count={count}
        />
      </bufferGeometry>
      {/* @ts-expect-error - Custom material */}
      <dustMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
};
