// Molas. `springStep` e `springImpulse` são analíticas (função pura do tempo),
// então qualquer coreografia feita com elas pode ser reproduzida ou pausada em qualquer instante.

/** Resposta ao degrau 0→1 de uma mola com frequência `omega` (rad/s) e amortecimento `zeta`. */
export function springStep(t: number, omega: number, zeta: number): number {
  if (t <= 0) return 0
  if (zeta >= 1) return 1 - Math.exp(-omega * t) * (1 + omega * t)
  const wd = omega * Math.sqrt(1 - zeta * zeta)
  const decay = Math.exp(-zeta * omega * t)
  return 1 - decay * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
}

/** Resposta a um impulso: sai de 0, oscila e volta a 0. Pico ≈ 1. */
export function springImpulse(t: number, omega: number, zeta: number): number {
  if (t <= 0) return 0
  const wd = omega * Math.sqrt(1 - zeta * zeta)
  return Math.exp(-zeta * omega * t) * Math.sin(wd * t)
}

/** Aproximação exponencial independente de framerate. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt)
}

/** Mola integrada para valores que perseguem um alvo móvel. */
export class Spring {
  value: number
  velocity = 0
  omega: number
  zeta: number

  constructor(value = 0, omega = 10, zeta = 0.6) {
    this.value = value
    this.omega = omega
    this.zeta = zeta
  }

  step(target: number, dt: number): number {
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)))
    const h = dt / steps
    const k = this.omega * this.omega
    const c = 2 * this.zeta * this.omega
    for (let i = 0; i < steps; i++) {
      this.velocity += (-k * (this.value - target) - c * this.velocity) * h
      this.value += this.velocity * h
    }
    return this.value
  }

  snap(value: number): void {
    this.value = value
    this.velocity = 0
  }
}

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
