varying vec3 vNormal;
varying vec3 vPosition;
uniform float uTime;
uniform float uGlowIntensity;

void main() {
  // Core glow color - warm white
  vec3 coreColor = vec3(1.0, 0.98, 0.95);

  // Soft glow based on normal
  float glow = 0.6 + 0.4 * abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));

  // Pulsing intensity
  float pulse = 0.8 + 0.2 * sin(uTime * 1.5);

  vec3 finalColor = coreColor * glow * pulse * uGlowIntensity;

  gl_FragColor = vec4(finalColor, 0.9);
}
