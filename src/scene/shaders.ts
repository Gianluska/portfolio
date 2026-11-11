// Todos os shaders da cena. Strings GLSL puras, compiladas por ShaderMaterial.
/** Lajes do baralho: cada instância recebe centro, escala, rotação e profundidade. */
export const deckVertex = /* glsl */ `
  attribute vec4 aXf;   // cx, cy, escala, rotação
  attribute vec4 aPrev; // idem, da laje de cima
  attribute vec4 aMisc; // z, flash, profundidade 0..1, espessura
  varying vec2 vDeck;
  varying vec2 vLocal;
  varying vec3 vNormal;
  varying vec4 vPrev;
  varying vec3 vMisc; // flash, profundidade, altura na parede
  varying float vScale;

  void main() {
    float c = cos(aXf.w);
    float s = sin(aXf.w);
    mat2 rot = mat2(c, s, -s, c);
    vec2 xy = rot * (position.xy * aXf.z) + aXf.xy;
    float z = aMisc.x + position.z * aMisc.w;
    vDeck = xy;
    vLocal = position.xy;
    vNormal = vec3(rot * normal.xy, normal.z);
    vPrev = aPrev;
    vMisc = vec3(aMisc.y, aMisc.z, 1.0 + position.z);
    vScale = aXf.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(xy, z, 1.0);
  }
`

/** Sombras analíticas da laje de cima e realces contidos nas quinas. */
export const deckFragment = /* glsl */ `
  uniform vec3 uEdge[5];
  uniform vec2 uLight;      // direção da luz no plano do baralho
  uniform float uTime;
  varying vec2 vDeck;
  varying vec2 vLocal;
  varying vec3 vNormal;
  varying vec4 vPrev;
  varying vec3 vMisc;
  varying float vScale;

  // Distância até a borda do pentágono unitário: positiva dentro do furo.
  float inside(vec2 p) {
    float d = 1e5;
    for (int i = 0; i < 5; i++) d = min(d, uEdge[i].z - dot(p, uEdge[i].xy));
    return d;
  }

  vec2 toPrev(vec2 p) {
    float c = cos(-vPrev.w);
    float s = sin(-vPrev.w);
    return mat2(c, s, -s, c) * (p - vPrev.xy) / vPrev.z;
  }

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  void main() {
    float flash = vMisc.x;
    float depth = vMisc.y;
    bool wall = vNormal.z < 0.5;

    // tom base: clareia nas lajes de fora, afunda em direção ao olho
    float tone = mix(0.055, 0.006, pow(depth, 0.7));
    float shade;
    float edge = 0.0;

    if (wall) {
      float facing = max(dot(normalize(vNormal.xy), uLight), 0.0);
      shade = (0.2 + 0.85 * facing * facing) * mix(0.45, 1.0, vMisc.z);
      edge = 1.0;
    } else {
      // sombra de contato e sombra projetada pela laje de cima
      float span = vPrev.z;
      float d = inside(toPrev(vDeck)) * span;
      float ao = 1.0 - exp(-max(d, 0.0) / (0.055 * span));
      float shadowEdge = inside(toPrev(vDeck + uLight * 0.085 * span)) * span;
      float lit = smoothstep(-0.03 * span, 0.05 * span, shadowEdge);
      // o degrau escurece em direção à própria borda, onde cai para o furo
      float own = -inside(vLocal) * vScale;
      float lip = 1.0 - exp(-max(own, 0.0) / (0.11 * vScale));
      shade = mix(0.2, 1.0, ao) * (0.5 + 0.5 * lit) * mix(1.12, 0.8, lip);
      // filete de luz na quina do furo
      float w = fwidth(own) * 1.4;
      edge = (1.0 - smoothstep(0.0, w, own)) * 0.35;
      shade += edge * 0.1;
    }

    vec3 color = vec3(tone * shade);

    // cada laje acende ao pousar
    color += flash * (wall ? 0.2 : 0.045) * mix(1.0, 0.45, depth);

    color += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
    gl_FragColor = vec4(color, 1.0);
  }
`


export const compositeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

/** Leva o baralho à tela com vinheta e grão de filme. */
export const compositeFragment = /* glsl */ `
  uniform sampler2D uScene;
  uniform float uAspect;
  uniform float uTime;
  uniform float uGrain;
  uniform float uGrainScale;
  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  void main() {
    vec4 scene = texture2D(uScene, vUv);
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float vignette = 1.0 - smoothstep(0.35, 1.2, length(p)) * 0.72;
    vec3 color = scene.rgb * vignette;

    // grão de filme: muda 24 vezes por segundo, um grão por pixel CSS, mais visível nos meios-tons
    vec2 cell = floor(gl_FragCoord.xy / uGrainScale);
    float frame = floor(uTime * 24.0);
    float n = (hash(cell + frame * vec2(17.31, 41.97)) + hash(cell * 1.7 + frame * vec2(5.13, 3.71))) * 0.5 - 0.5;
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    color += n * uGrain * (0.35 + 2.2 * lum) * scene.a;

    gl_FragColor = vec4(max(color, 0.0), scene.a);
  }
`
