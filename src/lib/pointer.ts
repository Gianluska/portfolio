import { env } from './env'

export interface Pointer {
  /** Normalizado em [-1, 1], y para cima. */
  x: number
  y: number
  /** Pixels. */
  px: number
  py: number
  vx: number
  vy: number
  down: boolean
  /** Verdadeiro quando há um ponteiro real se movendo; falso ativa a deriva autônoma. */
  live: boolean
  lastMove: number
}

// Estado único do ponteiro.
export const pointer: Pointer = {
  x: 0,
  y: 0,
  px: window.innerWidth / 2,
  py: window.innerHeight / 2,
  vx: 0,
  vy: 0,
  down: false,
  live: false,
  lastMove: -Infinity,
}

const IDLE_AFTER = 4

function set(px: number, py: number, time: number): void {
  pointer.vx = px - pointer.px
  pointer.vy = py - pointer.py
  pointer.px = px
  pointer.py = py
  pointer.x = (px / window.innerWidth) * 2 - 1
  pointer.y = -((py / window.innerHeight) * 2 - 1)
  pointer.lastMove = time
  pointer.live = true
}

window.addEventListener('pointermove', (e) => set(e.clientX, e.clientY, performance.now() / 1000), { passive: true })
window.addEventListener('pointerdown', (e) => {
  set(e.clientX, e.clientY, performance.now() / 1000)
  pointer.down = true
})
window.addEventListener('pointerup', () => (pointer.down = false))
window.addEventListener('pointercancel', () => (pointer.down = false))
document.addEventListener('pointerleave', () => (pointer.lastMove = -Infinity))

/** Chamado uma vez por frame: sem ponteiro ativo, descreve uma curva lenta para a cena não morrer. */
export function tickPointer(time: number): void {
  if (!pointer.down && (env.coarse || time - pointer.lastMove > IDLE_AFTER)) {
    pointer.live = false
    const x = Math.sin(time * 0.23) * 0.55 + Math.sin(time * 0.071) * 0.2
    const y = Math.cos(time * 0.17) * 0.4
    pointer.x += (x - pointer.x) * 0.02
    pointer.y += (y - pointer.y) * 0.02
    pointer.px = (pointer.x * 0.5 + 0.5) * window.innerWidth
    pointer.py = (-pointer.y * 0.5 + 0.5) * window.innerHeight
    pointer.vx = 0
    pointer.vy = 0
  }
}
