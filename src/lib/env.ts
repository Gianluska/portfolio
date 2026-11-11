const params = new URLSearchParams(window.location.search)

export interface Env {
  debug: boolean
  skipIntro: boolean
  /** Congela o fechamento neste instante (segundos). */
  freezeAt: number | null
  noWebGL: boolean
  reducedMotion: boolean
  coarse: boolean
}

export const env: Env = {
  debug: params.has('debug'),
  skipIntro: params.get('intro') === '0',
  freezeAt: params.has('t') ? Number(params.get('t')) : null,
  noWebGL: params.get('webgl') === '0',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  coarse: window.matchMedia('(pointer: coarse)').matches,
}

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}
