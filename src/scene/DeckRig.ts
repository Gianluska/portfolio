import {
  BufferAttribute,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Vector2,
  Vector3,
  type Group,
  type IUniform,
  type Mesh,
} from 'three'
import { clamp, damp, lerp, smoothstep, springImpulse, springStep } from '../lib/spring'
import type { Pointer } from '../lib/pointer'
import type { View } from './store'

// O "baralho": lajes empilhadas em profundidade, cada uma com um furo pentagonal
// menor e mais girado que o da laje de cima. Visto de frente vira um túnel em espiral.

const COUNT = 64
const SHRINK = 0.918 // razão entre furos consecutivos
const STEP_Z = 0.17 // espessura de cada laje
const OUTER = 3.2 // quanto a laje se estende além do próprio furo
const TWIST = 0.118 // giro por laje (rad)
const SWIRL = 2.1 // giro extra acumulado até o fundo (rad)
const DRIFT = 0.008 // quanto o centro deriva por laje, relativo ao furo: túnel quase centrado
const DRIFT_TURN = 0.17

// Entrada de cada laje
const START_SCALE = 1.35
const BURST = 38 // lajes da rajada final: as que cobrem a logo, em sequência rápida

/** Quanto o ponteiro entorta o túnel (1 = intensidade original). */
const POINTER_BEND = 0.2

type Vec2 = [number, number]

// Pentágono levemente irregular, como na referência.
const POLY: Vec2[] = [0, 1, 2, 3, 4].map((k) => {
  const angle = Math.PI / 2 + (k * Math.PI * 2) / 5 + ([0, 5, -7, 4, -4][k] * Math.PI) / 180
  const radius = [1.0, 0.95, 1.05, 0.97, 1.04][k]
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
})

// Normal para fora + distância ao centro de cada aresta do furo.
const EDGES: [number, number, number][] = POLY.map((a, k) => {
  const b = POLY[(k + 1) % 5]
  const ex = b[0] - a[0]
  const ey = b[1] - a[1]
  const len = Math.hypot(ex, ey)
  const nx = ey / len
  const ny = -ex / len
  return [nx, ny, a[0] * nx + a[1] * ny]
})
const INRADIUS = Math.min(...EDGES.map((e) => e[2]))

/** Uma laje: face de cima (anel pentagonal) + parede interna que desce até a laje de baixo. */
function buildGeometry(): InstancedBufferGeometry {
  const position: number[] = []
  const normal: number[] = []
  const tri = (a: number[], b: number[], c: number[], n: number[]) => {
    position.push(...a, ...b, ...c)
    normal.push(...n, ...n, ...n)
  }
  for (let k = 0; k < 5; k++) {
    const a = POLY[k]
    const b = POLY[(k + 1) % 5]
    const A = [a[0] * OUTER, a[1] * OUTER]
    const B = [b[0] * OUTER, b[1] * OUTER]
    tri([...a, 0], [...A, 0], [...B, 0], [0, 0, 1])
    tri([...a, 0], [...B, 0], [...b, 0], [0, 0, 1])
    const n = [-EDGES[k][0], -EDGES[k][1], 0]
    tri([...a, 0], [...b, 0], [...b, -1], n)
    tri([...a, 0], [...b, -1], [...a, -1], n)
  }
  const geometry = new InstancedBufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(position), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normal), 3))
  return geometry
}

export interface DeckUniforms {
  [name: string]: IUniform
  uEdge: IUniform<Vector3[]>
  uLight: IUniform<Vector2>
  uTime: IUniform<number>
}

export interface Aperture {
  /** Centro do furo atual em px, relativo ao centro da tela (y para baixo). */
  x: number
  y: number
  /** Raio inscrito do furo em px. */
  r: number
  closed: boolean
}

/** Estado e coreografia do baralho. Os objetos three são criados em JSX por `<Deck>`. */
export class DeckRig {
  readonly count = COUNT
  readonly geometry = buildGeometry()
  readonly uniforms: DeckUniforms
  group!: Group
  cap!: Mesh

  private xf = new Float32Array(COUNT * 4) // cx, cy, escala, rotação
  private prev = new Float32Array(COUNT * 4) // idem, da laje de cima
  private misc = new Float32Array(COUNT * 4) // z, flash, profundidade, espessura
  private aXf = new InstancedBufferAttribute(this.xf, 4).setUsage(DynamicDrawUsage)
  private aPrev = new InstancedBufferAttribute(this.prev, 4).setUsage(DynamicDrawUsage)
  private aMisc = new InstancedBufferAttribute(this.misc, 4).setUsage(DynamicDrawUsage)

  // posição de repouso de cada laje
  private base = {
    scale: new Float32Array(COUNT),
    rot: new Float32Array(COUNT),
    cx: new Float32Array(COUNT),
    cy: new Float32Array(COUNT),
  }
  private z = new Float32Array(COUNT)
  private persp = new Float32Array(COUNT)
  // deformação que segue o ponteiro, com atraso crescente em profundidade
  private bendX = new Float32Array(COUNT)
  private bendY = new Float32Array(COUNT)
  private bendR = new Float32Array(COUNT)
  private times = new Float32Array(COUNT)
  private view!: View
  private spinIdle = 0

  readonly tAnticipate: number
  readonly tBurst: number
  /** Instante em que a última laje pousa e a tela está fechada. */
  readonly tClosed: number
  /** Instante em que tudo assentou. */
  readonly tSettled: number

  readonly aperture: Aperture = { x: 0, y: 0, r: Infinity, closed: false }
  /** 0 durante a intro, 1 quando o baralho passa a reagir ao ponteiro. */
  idle = 0

  constructor() {
    this.geometry.setAttribute('aXf', this.aXf)
    this.geometry.setAttribute('aPrev', this.aPrev)
    this.geometry.setAttribute('aMisc', this.aMisc)
    this.geometry.instanceCount = 0

    this.uniforms = {
      uEdge: { value: EDGES.map((e) => new Vector3(...e)) },
      uLight: { value: new Vector2(-0.56, 0.83).normalize() },
      uTime: { value: 0 },
    }

    // cadência: o intervalo entre lajes cai em progressão geométrica, respira e dispara
    const burstFrom = COUNT - BURST
    let t = 0
    for (let i = 0; i < COUNT; i++) {
      this.times[i] = t
      if (i < burstFrom - 1) t += 0.092 * Math.pow(0.034 / 0.092, i / (burstFrom - 2))
      else if (i === burstFrom - 1) t += 0.2 // respira antes da rajada
      else t += 0.011 * (1 + 0.6 * Math.pow((i - burstFrom) / (BURST - 1), 2))
    }
    this.tAnticipate = this.times[burstFrom - 1]
    this.tBurst = this.times[burstFrom]
    this.tClosed = this.times[COUNT - 1] + 0.09
    this.tSettled = this.tClosed + 0.9
  }

  bindGroup = (group: Group | null): void => {
    if (group) this.group = group
  }

  bindCap = (cap: Mesh | null): void => {
    if (cap) this.cap = cap
  }

  layout(view: View): void {
    this.view = view
    const { base } = this
    const first = Math.hypot(view.halfW, view.halfH) * 1.13
    let x = 0
    let y = 0
    for (let i = 0; i < COUNT; i++) {
      const d = i / (COUNT - 1)
      base.scale[i] = first * Math.pow(SHRINK, i)
      base.rot[i] = 0.35 + i * TWIST + SWIRL * d * d
      base.cx[i] = x
      base.cy[i] = y
      const dir = 3.9 + i * DRIFT_TURN
      x += base.scale[i] * DRIFT * Math.cos(dir)
      y += base.scale[i] * DRIFT * Math.sin(dir)
      this.z[i] = -i * STEP_Z
      this.persp[i] = view.camZ / (view.camZ - this.z[i])
    }
    // desloca tudo para o olho do túnel cair no centro da tela
    for (let i = 0; i < COUNT; i++) {
      base.cx[i] -= x
      base.cy[i] -= y
    }
  }

  /**
   * Calcula o estado de todas as lajes.
   * `T` é o tempo de fechamento; tudo que depende dele é função pura.
   */
  update(T: number, time: number, dt: number, pointer: Pointer): void {
    const { base, xf, prev, misc, times, view } = this
    const idle = this.idle

    const progress = clamp(T / this.tBurst)
    // desenrola girando pouco; um leve recuo antes da rajada e um assentamento curto
    let spin = 0.14 * Math.pow(progress, 1.6)
    spin -= 0.008 * smoothstep(this.tAnticipate, this.tBurst, T)
    spin += 0.018 * springStep(T - this.tBurst, 24, 0.75)
    spin -= 0.018 * springStep(T - this.tClosed, 8, 0.7)
    this.spinIdle += dt * 0.012 * idle
    const groupRot = spin + this.spinIdle
    // o baralho recua enquanto fecha e dá um tranco quando trava
    const thump = springImpulse(T - this.tClosed, 15, 0.45)
    const groupScale = lerp(1.025, 1, 1 - Math.pow(1 - progress, 2.4)) * (1 + 0.006 * thump)
    this.group.rotation.z = groupRot
    this.group.scale.set(groupScale, groupScale, 1)

    let entered = 0
    let apR = Infinity
    let apI = -1
    for (let i = 0; i < COUNT; i++) {
      const te = T - times[i]
      if (te <= 0) break
      entered = i + 1
      const d = i / (COUNT - 1)

      // cada laje é uma mola própria, quase sem passar do ponto
      const ps = springStep(te, lerp(12, 26, d), 0.78)
      const pr = springStep(te - 0.012, lerp(9, 20, d), 0.82)
      let scale = base.scale[i] * Math.pow(START_SCALE, 1 - ps)
      let rot = base.rot[i] - lerp(0.35, 0.6, d) * (1 - pr)
      let cx = base.cx[i]
      let cy = base.cy[i]

      if (idle > 0) {
        // o ponteiro entorta o túnel; as lajes do fundo chegam depois
        const reach = 1 - base.scale[i] / base.scale[0]
        const rate = lerp(7.5, 1.7, d)
        this.bendX[i] = damp(this.bendX[i], pointer.x * 0.62 * POINTER_BEND * reach, rate, dt)
        this.bendY[i] = damp(this.bendY[i], pointer.y * 0.44 * POINTER_BEND * reach, rate, dt)
        this.bendR[i] = damp(this.bendR[i], pointer.x * 0.32 * POINTER_BEND * d, rate * 0.8, dt)
        cx += this.bendX[i] * idle
        cy += this.bendY[i] * idle
        rot += (this.bendR[i] + 0.028 * Math.sin(time * 0.33 - i * 0.13)) * idle
        scale *= 1 + 0.008 * Math.sin(time * 0.47 - i * 0.21) * idle
      }

      const o = i * 4
      xf[o] = cx
      xf[o + 1] = cy
      xf[o + 2] = scale
      xf[o + 3] = rot
      if (i === 0) {
        prev[0] = 0
        prev[1] = 0
        prev[2] = 1e4
        prev[3] = 0
      } else {
        prev[o] = xf[o - 4]
        prev[o + 1] = xf[o - 3]
        prev[o + 2] = xf[o - 2]
        prev[o + 3] = xf[o - 1]
      }
      const tau = te / 0.11
      misc[o] = this.z[i]
      misc[o + 1] = tau * Math.exp(1 - tau)
      misc[o + 2] = d
      misc[o + 3] = STEP_Z

      const r = scale * this.persp[i]
      if (r < apR) {
        apR = r
        apI = i
      }
    }

    this.geometry.instanceCount = entered
    this.aXf.needsUpdate = true
    this.aPrev.needsUpdate = true
    this.aMisc.needsUpdate = true
    this.uniforms.uTime.value = time

    // fundo do túnel: fecha o último furo
    const closed = entered === COUNT
    this.cap.visible = closed
    if (closed) {
      const o = (COUNT - 1) * 4
      this.cap.position.set(xf[o], xf[o + 1], this.z[COUNT - 1] - STEP_Z)
      this.cap.scale.setScalar(xf[o + 2] * OUTER)
    }

    // furo atual em px, para a logo recuar junto
    const ap = this.aperture
    ap.closed = closed
    if (apI < 0) {
      ap.r = Infinity
      ap.x = 0
      ap.y = 0
    } else {
      const o = apI * 4
      const k = this.persp[apI] * groupScale * view.pxPerUnit
      const c = Math.cos(groupRot)
      const s = Math.sin(groupRot)
      ap.r = apR * INRADIUS * groupScale * view.pxPerUnit
      ap.x = (xf[o] * c - xf[o + 1] * s) * k
      ap.y = -(xf[o] * s + xf[o + 1] * c) * k
    }
  }

}
