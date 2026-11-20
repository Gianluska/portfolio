// The first appearance waits for the impact wave to clear the sea (ms).
const FIRST_DELAY = 3400
const RETURN_DELAY = 500
// Spill choreography length before the loop stops (ms).
const SPILL_TIME = 1100

// Grid: row 0 is the sea running to the brink, the middle rows are the fall, the last row the pool.
const COLS = 9
const ROWS = 8
const MID = (COLS - 1) / 2
const POOL = ROWS - 1
// The grid steps at a fixed ASCII cadence instead of every display frame.
const STEP = 1 / 30
const LABEL = 'scroll'

interface Drop {
  x: number
  y: number
  v: number
}

/**
 * Bottom-center hint at the sea, drawn in the scene's own glyphs: the sea slides to a brink and a
 * thin stream falls into a pool. Gesture charge widens and speeds the fall, the word leans over the
 * edge, and a full charge empties the whole cue down out of the frame as the camera dives.
 */
export class ScrollCue {
  private first = true
  private timer = 0
  private frame = 0
  private stopTimer = 0
  private charging = false
  private spilling = false
  private progress = 0
  private time = 0
  private acc = 0
  private spawn = 0
  private last = 0
  private drops: Drop[] = []
  private splash = new Float32Array(COLS)
  private readonly cells: HTMLSpanElement[] = []
  private readonly glyph: string[] = []
  private readonly level: number[] = []

  constructor(private readonly el: HTMLElement) {
    el.replaceChildren()
    const label = document.createElement('span')
    label.className = 'flex font-mono text-[11px]/[1] font-medium text-white uppercase [margin-inline-end:calc(-0.28em_-_var(--p)*0.3em)] [letter-spacing:calc(0.28em_+_var(--p)*0.3em)] [opacity:calc(0.82_+_var(--p)*0.18)] [text-shadow:0_0_6px_#000,0_0_2px_#000]'
    for (const [i, letter] of [...LABEL].entries()) {
      const span = document.createElement('span')
      span.className = 'inline-block [translate:0_calc(var(--p)*var(--i)*0.9px)] [transition:translate_500ms_var(--spring,var(--ease-scene))] group-data-charging/cue:[transition-duration:120ms] group-data-spill/cue:animate-cue-letter-fall'
      span.textContent = letter
      span.style.setProperty('--i', String(i))
      label.append(span)
    }
    const fall = document.createElement('span')
    fall.className = 'grid font-mono text-[14px]/[10px] font-medium whitespace-pre text-white [text-shadow:0_0_4px_#000]'
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('span')
      row.className = 'flex group-data-spill/cue:animate-cue-row-fall'
      row.style.setProperty('--r', String(r))
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('span')
        cell.className = 'w-[1ch] text-center opacity-0 data-[l=1]:opacity-[0.38] data-[l=2]:opacity-70 data-[l=3]:opacity-100 data-[l=3]:cue-chroma'
        cell.textContent = ' '
        row.append(cell)
        this.cells.push(cell)
        this.glyph.push(' ')
        this.level.push(0)
      }
      fall.append(row)
    }
    el.append(label, fall)
  }

  show(): void {
    clearTimeout(this.timer)
    clearTimeout(this.stopTimer)
    this.el.removeAttribute('data-spill')
    this.spilling = false
    this.drops = []
    this.splash.fill(0)
    this.set(0)
    this.timer = window.setTimeout(() => {
      this.el.setAttribute('data-on', '')
      this.run()
    }, this.first ? FIRST_DELAY : RETURN_DELAY)
    this.first = false
  }

  /** Charge toward the waterfall, from 0 to 1. */
  set(progress: number): void {
    this.progress = progress
    this.el.style.setProperty('--p', progress.toFixed(4))
    const charging = progress > 0.001
    if (charging === this.charging) return
    this.charging = charging
    this.el.toggleAttribute('data-charging', charging)
  }

  spill(): void {
    clearTimeout(this.timer)
    this.set(1)
    if (!this.el.hasAttribute('data-on')) return this.stop()
    this.spilling = true
    this.el.setAttribute('data-spill', '')
    this.el.removeAttribute('data-on')
    clearTimeout(this.stopTimer)
    this.stopTimer = window.setTimeout(() => this.stop(), SPILL_TIME)
  }

  hide(): void {
    clearTimeout(this.timer)
    this.el.removeAttribute('data-on')
    clearTimeout(this.stopTimer)
    this.stopTimer = window.setTimeout(() => this.stop(), 600)
  }

  destroy(): void {
    clearTimeout(this.timer)
    clearTimeout(this.stopTimer)
    this.stop()
    this.el.removeAttribute('data-on')
    this.el.removeAttribute('data-spill')
    this.set(0)
    this.el.replaceChildren()
  }

  private run(): void {
    clearTimeout(this.stopTimer)
    if (this.frame) return
    this.last = performance.now()
    this.frame = requestAnimationFrame(this.loop)
  }

  private stop(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private loop = (now: number): void => {
    this.frame = requestAnimationFrame(this.loop)
    this.acc += Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    if (this.acc < STEP) return
    const dt = this.acc
    this.acc = 0
    this.step(dt)
    this.draw()
  }

  /** Half-width of the stream in columns. */
  private spread(): number {
    return this.spilling ? MID : this.progress * (MID - 0.5)
  }

  private step(dt: number): void {
    const p = this.spilling ? 1 : this.progress
    this.time += dt * (1 + p * 2.5)
    // Idle: a lone trickle every ~0.45 s. Charging: a curtain that thickens with intent.
    if (!this.spilling || this.time < 0.5) {
      const rate = p > 0.001 ? 4 + p * 72 : 2.2
      this.spawn += dt * rate
      const half = this.spread()
      while (this.spawn >= 1) {
        this.spawn -= 1
        const offset = (Math.random() + Math.random() - 1) * (half + 0.49)
        const x = Math.max(0, Math.min(COLS - 1, Math.round(MID + offset)))
        this.drops.push({ x, y: 0.6, v: 3 + p * 8 + Math.random() * 2 })
      }
    }
    const gravity = 22 + p * 40
    for (const drop of this.drops) {
      drop.v += gravity * dt
      drop.y += drop.v * dt
      if (drop.y >= POOL) this.splash[drop.x] = 1
    }
    this.drops = this.drops.filter((drop) => drop.y < POOL)
    for (let c = 0; c < COLS; c++) this.splash[c] = Math.max(0, this.splash[c] - dt * 4.5)
  }

  private put(row: number, col: number, glyph: string, level: number): void {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return
    const i = row * COLS + col
    if (level < this.level[i]) return
    this.glyph[i] = glyph
    this.level[i] = level
  }

  private draw(): void {
    const prevGlyph = this.glyph.slice()
    const prevLevel = this.level.slice()
    this.glyph.fill(' ')
    this.level.fill(0)
    const p = this.spilling ? 1 : this.progress
    const half = this.spread()

    // The sea slides toward the brink from both sides; the lip over the stream is brighter.
    if (!this.spilling || this.time < 0.5) {
      for (let c = 0; c < COLS; c++) {
        const d = Math.abs(c - MID)
        const wave = Math.sin(d * 1.4 + this.time * 7)
        const lip = d <= half + 0.5
        this.put(0, c, lip ? (wave > 0 ? '~' : '-') : wave > 0.2 ? '-' : '.', lip ? 2 : 1)
      }
    }

    // Each drop is a bright head with a trail that lengthens as it speeds up.
    for (const drop of this.drops) {
      const row = Math.floor(drop.y)
      const head = drop.v < 9 ? ':' : drop.v < 16 ? '¦' : '|'
      this.put(row, drop.x, head, 3)
      const trail = Math.min(3, Math.floor(drop.v / 7))
      for (let t = 1; t <= trail; t++) this.put(row - t, drop.x, t === trail ? '.' : ':', t === 1 ? 2 : 1)
    }

    // Pool: a faint basin that widens with the stream, with a burst wherever water lands.
    const basin = Math.max(1, half + 1.5)
    for (let c = 0; c < COLS; c++) {
      const d = Math.abs(c - MID)
      if (d <= basin) this.put(POOL, c, p > 0.001 ? (Math.sin(c * 2 - this.time * 9) > 0 ? '~' : '-') : '_', 1)
      const s = this.splash[c]
      if (s > 0.55) {
        this.put(POOL, c, '*', 3)
        this.put(POOL - 1, c - 1, "'", 2)
        this.put(POOL - 1, c + 1, "'", 2)
      } else if (s > 0.15) {
        this.put(POOL, c, 'o', 2)
        this.put(POOL, c - 1, '.', 2)
        this.put(POOL, c + 1, '.', 2)
      }
    }

    for (let i = 0; i < this.cells.length; i++) {
      if (this.glyph[i] !== prevGlyph[i]) this.cells[i].textContent = this.glyph[i]
      if (this.level[i] !== prevLevel[i]) this.cells[i].dataset.l = String(this.level[i])
    }
  }
}
