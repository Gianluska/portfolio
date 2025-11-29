varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
uniform float uTime;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  // Subtle vertex displacement for liquid effect
  vec3 pos = position;
  float displacement = sin(pos.x * 3.0 + uTime * 0.5) * 0.02;
  displacement += cos(pos.y * 3.0 + uTime * 0.4) * 0.02;
  displacement += sin(pos.z * 3.0 + uTime * 0.6) * 0.02;
  pos += normal * displacement;

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
