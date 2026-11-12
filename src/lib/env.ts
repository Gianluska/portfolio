const params = new URLSearchParams(window.location.search)

export const env = {
  skipIntro: params.get('intro') === '0',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}

export function wait(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}
