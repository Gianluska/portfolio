import type { Stage } from '../scene/store'

interface Scrubbable {
  phase: string
  scrub: number | null
}

/** `?debug`: fase, FPS e scrub do fechamento do baralho. */
export class DebugPanel {
  private director: Scrubbable
  private el: HTMLDivElement
  private phase: HTMLElement
  private fps: HTMLElement
  private t: HTMLElement
  private range: HTMLInputElement
  private last = 0

  constructor(director: Scrubbable) {
    this.director = director
    const el = document.createElement('div')
    el.className = 'debug'
    el.innerHTML = `
      <div class="debug__row"><span data-k="phase"></span><span data-k="fps"></span></div>
      <label class="debug__row">T <input type="range" min="0" max="5" step="0.005" value="0"> <span data-k="t"></span></label>
      <button type="button">ao vivo</button>`
    document.body.append(el)
    this.el = el
    const q = (k: string) => el.querySelector<HTMLElement>(`[data-k="${k}"]`)!
    this.phase = q('phase')
    this.fps = q('fps')
    this.t = q('t')
    this.range = el.querySelector('input')!
    this.range.addEventListener('input', () => (director.scrub = Number(this.range.value)))
    el.querySelector('button')!.addEventListener('click', () => (director.scrub = null))
  }

  frame(stage: Stage): void {
    const now = performance.now()
    if (now - this.last < 120) return
    this.last = now
    this.range.max = stage.deck.tSettled.toFixed(2)
    if (this.director.scrub == null) this.range.value = String(Math.min(stage.closeT, stage.deck.tSettled))
    this.phase.textContent = this.director.phase
    this.fps.textContent = `${stage.fps.toFixed(0)} fps · q${stage.quality.toFixed(2)}`
    this.t.textContent = `${stage.closeT.toFixed(2)}s / ${stage.deck.tClosed.toFixed(2)}s`
  }

  destroy(): void {
    this.el.remove()
  }
}
