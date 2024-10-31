export const fragmentShader = `
  varying vec2 vUv;
  varying float vNoise;

  void main() {
    vec3 baseColor = vec3(1.6, 0.0, 0.0);
    vec3 color = baseColor  * 0.1;
    gl_FragColor = vec4(color, 1.0);
  }
`;