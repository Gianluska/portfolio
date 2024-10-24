import { useRef, useMemo, useEffect } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// Shaders permanecem os mesmos...
const finalFragmentShader = `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;
  varying vec2 vUv;

  float ss(float a, float b, float t) {
    return smoothstep(a, b, t);
  }

  void main() {
    vec2 uv = vUv;
    
    vec3 dither = texture2D(iChannel1, vUv).rgb;
    
    vec4 data = texture2D(iChannel0, uv);
    float gray = data.r;
    
    float range = 3.0;
    vec2 aspect = vec2(iResolution.x/iResolution.y, 1.0);
    float pixelSize = range/iResolution.x;
    vec2 dx = vec2(pixelSize * aspect.x, 0.0);
    vec2 dy = vec2(0.0, pixelSize);
    
    float left = texture2D(iChannel0, uv - dx).r;
    float right = texture2D(iChannel0, uv + dx).r;
    float top = texture2D(iChannel0, uv - dy).r;
    float bottom = texture2D(iChannel0, uv + dy).r;
    
    vec3 normal = normalize(vec3(
      (right - left) * 2.0,
      (bottom - top) * 2.0,
      0.1
    ));
    
    vec3 lightPos = vec3(cos(iTime) * 2.0, 2.0, sin(iTime) * 2.0);
    vec3 lightDir = normalize(lightPos);
    float diffuse = max(0.0, dot(normal, lightDir));
    
    vec3 color = vec3(0.4) * diffuse;
    
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(0.0, dot(normal, halfDir)), 32.0);
    color += vec3(1.0) * specular * 0.5;
    
    vec3 tint = 0.5 + 0.5 * cos(vec3(1.0, 2.0, 3.0) + diffuse * 4.0 - uv.y * 2.0);
    color += tint * smoothstep(0.2, 0.0, gray) * 0.3;
    
    color -= dither * 0.05;
    
    float vignette = smoothstep(1.4, 0.0, length(uv - 0.5));
    color *= vignette;
    
    color = pow(color, vec3(0.4545));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const finalVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Aqui está a correção principal - mudando como definimos os uniforms
const FinalMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: [1, 1],  // Mudado para array ao invés de Vector2
    iChannel0: null,
    iChannel1: null,
  },
  finalVertexShader,
  finalFragmentShader
);

extend({ FinalMaterial });

export function InteractiveCanvas() {
  const finalRef = useRef();
  const { size, viewport } = useThree();
  
  const resources = useMemo(() => {
    const noiseSize = 512;
    const noiseData = new Float32Array(noiseSize * noiseSize * 4);
    
    for (let i = 0; i < noiseData.length; i += 4) {
      const value = Math.random();
      noiseData[i] = value;
      noiseData[i + 1] = value;
      noiseData[i + 2] = value;
      noiseData[i + 3] = 1;
    }
    
    const noiseTexture = new THREE.DataTexture(
      noiseData,
      noiseSize,
      noiseSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    noiseTexture.needsUpdate = true;
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

    const blueNoiseData = new Float32Array(noiseSize * noiseSize * 4);
    for (let i = 0; i < blueNoiseData.length; i += 4) {
      const value = Math.random();
      blueNoiseData[i] = value;
      blueNoiseData[i + 1] = value;
      blueNoiseData[i + 2] = value;
      blueNoiseData[i + 3] = 1;
    }
    
    const blueNoiseTexture = new THREE.DataTexture(
      blueNoiseData,
      noiseSize,
      noiseSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    blueNoiseTexture.needsUpdate = true;
    blueNoiseTexture.wrapS = THREE.RepeatWrapping;
    blueNoiseTexture.wrapT = THREE.RepeatWrapping;

    return {
      noiseTexture,
      blueNoiseTexture
    };
  }, []);

  // Atualização dos uniforms corrigida
  useEffect(() => {
    if (finalRef.current) {
      // Agora passamos os valores como array
      finalRef.current.uniforms.iResolution.value = [size.width, size.height];
      finalRef.current.uniforms.iChannel0.value = resources.noiseTexture;
      finalRef.current.uniforms.iChannel1.value = resources.blueNoiseTexture;
    }
  }, [resources, size]);

  useFrame((state) => {
    if (finalRef.current) {
      finalRef.current.uniforms.iTime.value = state.clock.elapsedTime;
    }
  });

  const scale = viewport.width / 4;

  return (
    <mesh scale={[scale, scale, 1]} position={[0, 0, 0]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <finalMaterial 
        ref={finalRef}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}