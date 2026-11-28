// The original seamless 24×24 blue-noise thresholds, one byte per 2 CSS pixels.
const TILE = 24
const THRESHOLDS = Uint8Array.from(atob(
  'ggWdZfm0LnpDax76MNMC9HDbe/g+1xrCYLHVKpIP3qwMzadQnmuUQLkbyVKtaZkv7z97Tspoh0jzjDvFEu0p2FyZMYoC5EzL'
  + 'kCDlohvpNL1kKeVjh1OtfQy0c+u9NXwRZ75bN7teoxfOfQW11BzmQcb9RB1flPmv4Qqa/IQH7olQ+51HMJ9fji1hja7WF1gt'
  + 'ScZwJ0/Pbj22LGbffvUIzKgO3Tt0ocuAlyPcj7YyluIMj8ATUbBsRuxvvyHsRQXwardaD/JdG8NZ6jiDyyHbhRicVYGrYbo5'
  + 'Fec1p3fUpXQpqWvxl0GlK9U49hDZJYnPqnKN2UQBPPSK2B5WBHP9Urp4wU6bdftRLu8RYMCTuFUURryh5L8UkGIGiSvNPxOV'
  + 'yE2xL/4fduiayncmg0qp5zrZpupqreBlBn7aaIhKyDFeCPdg2jFsHMVyH1QKgSy1+D6iFeOfGajekzSzF4z1soZC+pK87UyO'
  + 'HtJXxDZd8nFDetdLoNI8WA2mxzNkHc5ou3oJcZfOA7wiqxDDaQN5wOlnFn7cqjqbJ92k6yWCP5DoUvqFLe+cIoxH8aBPAfNK'
  + 'iFwyTr78WdJ2NGOkRcdT3zbJdSbDkXPQDfewfw5vIK4LweAStX8YbZYHrEPhWySmx3Ya6Ju43TyegCpu8zPWsf5Z0YYTsu5C'
  + 'mDfRVihIi2b3VdCRSZ9iED15I/BtOYtkIrNvlMLsBLkZOLcI4iTMheOixEu45AnT9kfhFkCBWtaY5oRdr3xNqihXC5UmeKNU',
), (c) => Math.ceil(c.charCodeAt(0) / 1.25))

/** Quantize the composed grayscale frame in-place, before it reaches the CSS compositor. */
export class CanvasPalette {
  private readonly colors: Uint32Array
  private thresholds = new Uint8Array(0)
  private rows = new Uint32Array(0)
  readonly context: CanvasRenderingContext2D

  constructor(output: HTMLCanvasElement) {
    // Keep the canvas CPU-backed so the read never synchronizes with the GPU.
    const context = output.getContext('2d', { alpha: false, willReadFrequently: true })
    if (!context) throw new Error('The 1-bit scene requires a 2D canvas context')
    this.context = context
    const style = getComputedStyle(output)
    const rgb = (name: string) => style.getPropertyValue(name).trim().split(/\s+/).map(Number)
    this.colors = new Uint32Array(new Uint8Array([
      ...rgb('--scene-rgb'), 255, ...rgb('--scene-ink-rgb'), 255,
    ]).buffer)
  }

  static scale(width: number, height: number): number {
    // The artwork uses 2 CSS pixel dots; avoid paying for a device-resolution raster.
    return Math.min(1, window.devicePixelRatio || 1, Math.sqrt(900_000 / (width * height)))
  }

  resize(width: number, height: number, dpr: number): void {
    const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr))
    this.context.canvas.width = w
    this.context.canvas.height = h
    this.thresholds = new Uint8Array(TILE * w)
    this.rows = new Uint32Array(h)
    const pixel = 2 * dpr
    for (let x = 0; x < w; x++) {
      const col = Math.floor((x + 0.5) / pixel) % TILE
      for (let row = 0; row < TILE; row++) this.thresholds[row * w + x] = THRESHOLDS[row * TILE + col]
    }
    for (let y = 0; y < h; y++) this.rows[y] = Math.floor((y + 0.5) / pixel) % TILE * w
  }

  present(top: number): void {
    const { width, height } = this.context.canvas
    const image = this.context.getImageData(0, top, width, height - top)
    const bytes = image.data, words = new Uint32Array(bytes.buffer)
    const thresholds = this.thresholds
    const colors = this.colors
    for (let y = top, i = 0; y < height; y++) {
      const end = i + width
      for (let rank = this.rows[y]; i < end; i++, rank++) {
        words[i] = colors[+(bytes[i * 4] >= thresholds[rank])]
      }
    }
    this.context.putImageData(image, 0, top)
  }
}
