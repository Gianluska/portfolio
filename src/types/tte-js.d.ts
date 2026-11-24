declare module 'tte.js' {
  // The pinned upstream package ships JavaScript only. Keep this declaration
  // limited to the API used by the intro.
  export interface TextEffect {
    play(): Promise<{ cancelled: boolean }>
    destroy(): void
  }

  export interface TextEffectOptions {
    sourceEffect: string
    effect: string
    duration: number
    colors: string[]
    fontScale: number
    fps: number
    loop: boolean
    autoplay: boolean
    respectReducedMotion: boolean
  }

  interface EffectContext {
    options: TextEffectOptions
  }

  export interface EffectCell {
    character: string
    row: number
    column: number
    alpha?: number
    color?: string
    glow?: number
  }

  export interface EffectFrame {
    cells: readonly EffectCell[]
    particles?: readonly EffectCell[]
    beam?: { row: number; column: number; color: string }
  }

  interface Effect {
    render(progress: number, elapsed: number): EffectFrame
  }

  export function createEffect(name: string, context: EffectContext): Effect
  export function registerEffect(name: string, factory: (context: EffectContext) => Effect): void

  export function createTextEffect(target: HTMLElement, options: TextEffectOptions): TextEffect
  export function effectNames(): string[]
}
