varying vec3 vNormal;
varying vec3 vPosition;
uniform float uTime;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  // Subtle pulsing
  vec3 pos = position;
  float pulse = 1.0 + sin(uTime * 2.0) * 0.05;
  pos *= pulse;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
