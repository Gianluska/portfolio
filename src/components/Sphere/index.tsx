import React, { useRef, useEffect } from 'react';
import { ShaderMaterial, DoubleSide, AdditiveBlending, MathUtils, Vector2 } from 'three';
import { useFrame } from '@react-three/fiber';
import { MysticFogShader } from './customShaderMaterial';

const MysticFogSphere: React.FC = () => {
  const materialRef = useRef<ShaderMaterial>(null);
  const vMouse = useRef(new Vector2());
  const vMouseDamp = useRef(new Vector2());
  const fixedResolution = new Vector2(512, 512); // Valor fixo para u_resolution

  // Atualiza o tempo nos uniforms
  useFrame(({ clock }, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();

      // Suaviza o movimento do mouse com damping
      vMouseDamp.current.x = MathUtils.damp(
        vMouseDamp.current.x,
        vMouse.current.x,
        8,
        delta
      );
      vMouseDamp.current.y = MathUtils.damp(
        vMouseDamp.current.y,
        vMouse.current.y,
        8,
        delta
      );

      // Atualiza os uniforms de mouse
      if (materialRef.current.uniforms.u_mouse) {
        materialRef.current.uniforms.u_mouse.value.copy(vMouseDamp.current);
      }
    }
  });

  // Eventos de movimento do mouse
  useEffect(() => {
    const onPointerMove = (e: MouseEvent) => {
      // Ajusta as coordenadas do mouse para o tamanho fixo de resolução
      vMouse.current.set(
        (e.clientX / window.innerWidth) * fixedResolution.x,
        ((window.innerHeight - e.clientY) / window.innerHeight) * fixedResolution.y
      );
    };
    window.addEventListener('pointermove', onPointerMove);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <mesh scale={[0.5, 0.5, 0.5]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uTime: { value: 0 },
          u_mouse: { value: vMouseDamp.current },
          u_resolution: { value: fixedResolution },
          u_pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        }}
        vertexShader={MysticFogShader.vertexShader}
        fragmentShader={MysticFogShader.fragmentShader}
        transparent={true}
        blending={AdditiveBlending}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

export default MysticFogSphere;
