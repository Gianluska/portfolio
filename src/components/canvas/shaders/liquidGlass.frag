varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uMouse;

void main() {
  // Fresnel effect for glass edges
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);

  // Chromatic aberration / rainbow effect
  float r = fresnel * (0.5 + 0.5 * sin(uTime * 0.5 + vPosition.x * 2.0));
  float g = fresnel * (0.5 + 0.5 * sin(uTime * 0.5 + vPosition.y * 2.0 + 2.094));
  float b = fresnel * (0.5 + 0.5 * sin(uTime * 0.5 + vPosition.z * 2.0 + 4.188));

  // Base glass color - very subtle
  vec3 baseColor = vec3(0.1, 0.1, 0.12);

  // Combine fresnel edge glow with subtle color
  vec3 glassColor = baseColor + vec3(r, g, b) * 0.3;

  // Add specular highlights
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float specular = pow(max(dot(reflect(-lightDir, vNormal), viewDirection), 0.0), 32.0);
  glassColor += vec3(1.0) * specular * 0.5;

  // Edge detection for that liquid glass rim
  float edge = pow(fresnel, 1.5);
  glassColor += vec3(0.6, 0.7, 0.8) * edge * 0.4;

  // Transparency based on fresnel - more transparent in center, opaque at edges
  float alpha = 0.15 + fresnel * 0.5;

  gl_FragColor = vec4(glassColor, alpha);
}
