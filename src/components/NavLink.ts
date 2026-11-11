import { randomGlyph } from '../lib/scramble'
import { Spring } from '../lib/spring'
import { SPECTRUM } from '../lib/palette'
import { env } from '../lib/env'

type ScrambleSpan = HTMLSpanElement & { tick?: number }

/**
 * Link do menu: o texto embaralha em ASCII e resolve da esquerda para a direita,
 * o sublinhado entra branco e sai disperso em espectro, e o link é atraído pelo cursor.
 */
export class NavLink {
  private el: HTMLElement
  private text: string
  private chars: ScrambleSpan[]
  private x = new Spring(0, 13, 0.42)
  private y = new Spring(0, 13, 0.42)
  private tx = 0
  private ty = 0
  private raf: number | null = null
  private last = 0
  private scrambleAt = 0
  private scrambling = false

  constructor(el: HTMLElement) {
    this.el = el
    const label = el.querySelector<HTMLElement>('[data-label]')
    if (!label) throw new Error('NavLink precisa de um [data-label]')
    this.text = label.textContent ?? ''
    label.textContent = ''
    label.setAttribute('aria-hidden', 'true')
    el.setAttribute('aria-label', this.text)
    this.chars = [...this.text].map((ch) => {
      const span = document.createElement('span')
      span.className = 'nav__ch'
      span.textContent = ch
      label.append(span)
      return span
    })
    el.addEventListener('pointerenter', this.enter)
    el.addEventListener('pointerleave', this.leave)
    el.addEventListener('pointermove', this.move)
    el.addEventListener('focus', this.enter)
    el.addEventListener('blur', this.leave)
  }

  private enter = (): void => {
    this.el.classList.add('is-in')
    this.el.classList.remove('is-out')
    this.scramble()
  }

  private leave = (): void => {
    this.el.classList.remove('is-in')
    this.el.classList.add('is-out')
    this.tx = 0
    this.ty = 0
    this.run()
  }

  private move = (e: PointerEvent): void => {
    if (env.reducedMotion || e.pointerType === 'touch') return
    const rect = this.el.getBoundingClientRect()
    // mede a partir da posição de repouso, senão o link foge do próprio deslocamento
    const cx = rect.left + rect.width / 2 - this.x.value
    const cy = rect.top + rect.height / 2 - this.y.value
    this.tx = (e.clientX - cx) * 0.34
    this.ty = (e.clientY - cy) * 0.42
    this.run()
  }

  scramble(delay = 0): void {
    if (env.reducedMotion) return
    this.scrambleAt = performance.now() + delay
    this.scrambling = true
    this.run()
  }

  private run(): void {
    if (this.raf) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private frame = (now: number): void => {
    this.raf = null
    const dt = Math.min((now - this.last) / 1000, 1 / 20)
    this.last = now
    const x = this.x.step(this.tx, dt)
    const y = this.y.step(this.ty, dt)
    this.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
    let moving = Math.abs(x - this.tx) > 0.05 || Math.abs(y - this.ty) > 0.05 || Math.abs(this.x.velocity) > 0.5

    if (this.scrambling) {
      const t = now - this.scrambleAt
      let pending = false
      this.chars.forEach((span, j) => {
        const settle = 110 + j * 38
        const ch = this.text[j]
        if (t < settle) {
          pending = true
          if (t >= 0 && Math.floor(t / 42) !== span.tick) {
            span.tick = Math.floor(t / 42)
            span.textContent = randomGlyph()
            span.style.color = SPECTRUM[(j + span.tick) % SPECTRUM.length]
          }
        } else if (span.textContent !== ch || span.style.color) {
          span.textContent = ch
          span.style.color = ''
        }
      })
      this.scrambling = pending
      moving = moving || pending
    }
    if (moving) this.raf = requestAnimationFrame(this.frame)
  }

  destroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.el.removeEventListener('pointerenter', this.enter)
    this.el.removeEventListener('pointerleave', this.leave)
    this.el.removeEventListener('pointermove', this.move)
    this.el.removeEventListener('focus', this.enter)
    this.el.removeEventListener('blur', this.leave)
  }
}
