declare module 'tte.js' {
  // The pinned upstream package ships JavaScript only. Keep this declaration
  // limited to the API used by the intro.
  export interface TextEffect {
    play(): Promise<{ cancelled: boolean }>
    destroy(): void
  }

  export interface TextEffectOptions {
    effect: string
    duration: number
    colors: string[]
    fontScale: number
    fps: number
    loop: boolean
    autoplay: boolean
    respectReducedMotion: boolean
  }

  export function createTextEffect(target: HTMLElement, options: TextEffectOptions): TextEffect
  export function effectNames(): string[]
}
