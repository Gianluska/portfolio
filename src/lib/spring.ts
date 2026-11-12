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

}
