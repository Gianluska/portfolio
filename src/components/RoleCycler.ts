import { gsap } from '../lib/ease'

/** A especialidade muda sem embaralhar a informação nem deslocar o layout. */
export class RoleCycler {
  private index = 0
  private transition: gsap.core.Timeline | null = null
  private el: HTMLElement
  private roles: string[]
  private reduced: boolean

  constructor(el: HTMLElement, roles: string[], reduced = false) {
    this.el = el
    this.roles = roles
    this.reduced = reduced
    el.textContent = roles[0]
  }

  next(): void {
    this.show((this.index + 1) % this.roles.length)
  }

  show(index: number): void {
    this.transition?.kill()
    const text = this.roles[index]
    this.index = index
    if (this.reduced || this.el.textContent === text) {
      this.el.textContent = text
      gsap.set(this.el, { opacity: 1 })
      return
    }
    this.transition = gsap.timeline()
      .to(this.el, { opacity: 0, duration: 0.18, ease: 'rise' })
      .add(() => { this.el.textContent = text })
      .to(this.el, { opacity: 1, duration: 0.35, ease: 'rise' })
  }

  destroy(): void {
    this.transition?.kill()
  }
}
