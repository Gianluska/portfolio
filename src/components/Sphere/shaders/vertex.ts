import { simplexNoise } from "./simplexNoise";

export const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vNoise;

  ${simplexNoise}

  void main() {
    vUv = uv;
    
    float noise = snoise(position + uTime * 0.5);

    vNoise = noise; 

    vec3 newPosition = position + normal * noise * 0.3;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;