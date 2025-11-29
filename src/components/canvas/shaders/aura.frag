varying vec3 vNormal;
varying vec3 vPosition;
uniform float uTime;

void main() {
  vec3 viewDir = normalize(-vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 4.0);

  vec3 glowColor = vec3(0.9, 0.92, 1.0);
  float pulse = 0.7 + 0.3 * sin(uTime * 1.5);

  gl_FragColor = vec4(glowColor * fresnel * pulse, fresnel * 0.3);
}
