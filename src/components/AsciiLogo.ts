import { glyphs, type GlyphLetter } from '../data/glyphs'

const TEMPO = [118, 176, 139, 203] // ms; cada letra tem o seu ritmo

interface ResolveOptions {
  stagger?: number
  steps?: number[]
  chroma?: boolean
}

/**
 * Logo "lvsk" em ASCII. Cada letra vive numa célula de largura fixa e pode trocar
 * de fonte FIGlet sem que a logo mude de tamanho.
 */
export class AsciiLogo {
  private el: HTMLElement
  private letters: GlyphLetter[]
  private cells: HTMLSpanElement[]
  private last: number[]
  private timers = new Set<number>()
  private loops: (number | null)[]
  private busy = false

  constructor(el: HTMLElement) {
    this.el = el
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
    this.loops = this.letters.map(() => null)
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

  /** Todas as letras passam a trocar de fonte, cada uma no seu tempo. */
  startCycling(): void {
    this.el.classList.add('is-cycling')
    this.letters.forEach((_, i) => {
      const loop = () => {
        this.variant(i)
        this.loops[i] = this.later(loop, TEMPO[i] * (0.7 + Math.random() * 0.6))
      }
      this.loops[i] = this.later(loop, Math.random() * 120)
    })
  }

  private stopCycling(i: number): void {
    const id = this.loops[i]
    if (id != null) {
      clearTimeout(id)
      this.timers.delete(id)
    }
    this.loops[i] = null
  }

  /** Da primeira à última letra: algumas trocas desacelerando e trava na fonte oficial. */
  resolve({ stagger = 150, steps = [50, 70, 110], chroma = false }: ResolveOptions = {}): Promise<void> {
    return new Promise((done) => {
      this.letters.forEach((_, i) => {
        this.later(() => {
          this.stopCycling(i)
          const cell = this.cells[i]
          cell.classList.remove('is-locked')
          if (chroma) cell.classList.add('is-chroma')
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
              if (i === this.letters.length - 1) {
                this.el.classList.remove('is-cycling')
                done()
              }
            }, at)
          })
        }, i * stagger)
      })
    })
  }

  /** Hover do header: uma onda de trocas percorre a logo e ela volta para a fonte oficial. */
  wave(): void {
    if (this.busy) return
    this.busy = true
    this.resolve({ stagger: 70, steps: [50, 55, 65, 80, 105], chroma: true }).then(() => (this.busy = false))
  }

  setOfficial(): void {
    this.letters.forEach((_, i) => {
      this.stopCycling(i)
      this.official(i)
    })
    this.el.classList.remove('is-cycling')
  }

  destroy(): void {
    this.timers.forEach(clearTimeout)
    this.timers.clear()
  }
}
