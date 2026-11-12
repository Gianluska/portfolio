import { glyphs, type GlyphLetter } from '../data/glyphs'

/**
 * Logo "lvsk" do cabeçalho. Células fixas preservam o tamanho durante a onda
 * de variantes FIGlet no hover e no foco.
 */
export class AsciiLogo {
  private letters: GlyphLetter[]
  private cells: HTMLSpanElement[]
  private last: number[]
  private timers = new Set<number>()
  private busy = false

  constructor(el: HTMLElement) {
    el.classList.add('ascii')
    el.setAttribute('role', 'img')
    el.setAttribute('aria-label', 'lvsk')
    this.letters = glyphs.letters
    this.cells = this.letters.map((letter) => {
      const cell = document.createElement('span')
      cell.className = 'ascii__cell'
      cell.style.width = `${letter.width}ch`
      cell.setAttribute('aria-hidden', 'true')
      el.append(cell)
      return cell
    })
    this.last = this.letters.map(() => -1)
    this.letters.forEach((_, i) => this.official(i))
  }

  private later(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id)
      fn()
    }, ms)
    this.timers.add(id)
    return id
  }

  private official(i: number): void {
    this.cells[i].textContent = this.letters[i].official.join('\n')
    this.last[i] = -1
  }

  private variant(i: number): void {
    const { variants } = this.letters[i]
    let pick = (Math.random() * variants.length) | 0
    if (pick === this.last[i]) pick = (pick + 1) % variants.length
    this.last[i] = pick
    this.cells[i].textContent = variants[pick].join('\n')
  }


  private resolve(): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>()
    const steps = [50, 55, 65, 80, 105]
    this.letters.forEach((_, i) => {
      this.later(() => {
        const cell = this.cells[i]
        cell.classList.remove('is-locked')
        cell.classList.add('is-chroma')
        this.variant(i)
        let at = 0
        steps.forEach((ms, k) => {
          at += ms
          this.later(() => {
            if (k < steps.length - 1) return this.variant(i)
            this.official(i)
            cell.classList.remove('is-chroma')
            void cell.offsetWidth
            cell.classList.add('is-locked')
            if (i === this.letters.length - 1) resolve()
          }, at)
        })
      }, i * 70)
    })
    return promise
  }

  /** Hover do header: uma onda de trocas percorre a logo e ela volta para a fonte oficial. */
  wave(): void {
    if (this.busy) return
    this.busy = true
    this.resolve().then(() => (this.busy = false))
  }


  destroy(): void {
    this.timers.forEach(clearTimeout)
    this.timers.clear()
  }
}
