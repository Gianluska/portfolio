import { animateSkeleton, asciiSkeletonHTML, SKELETON_CSS } from 'ascii-reveal/core'

// ascii-reveal 0.3.0 caps block textures at 96 glyph columns.
const SKELETON_COLUMNS = 96

export class AsciiDither {
  private readonly styles = document.createElement('style')
  private readonly metrics: CanvasRenderingContext2D

  constructor(root: HTMLElement) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    this.metrics = canvas.getContext('2d')!
    this.styles.textContent = SKELETON_CSS
    root.append(this.styles)
  }

  /** Fills the overlay with a shimmering dither block that tracks the line size. */
  mount(line: HTMLElement, overlay: HTMLElement, seed: number): () => void {
    const style = getComputedStyle(overlay)
    const baseFontSize = Number.parseFloat(style.fontSize)
    this.metrics.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const advance = this.metrics.measureText('M').width
    let width = -1
    let height = -1
    let disposed = false
    let stopShimmer: (() => void) | null = null
    const render = () => {
      if (disposed) return
      const bounds = line.getBoundingClientRect()
      if (bounds.width === width && bounds.height === height) return
      width = bounds.width
      height = bounds.height
      stopShimmer?.()
      const fontSize = Math.max(baseFontSize,
        Math.ceil(width * baseFontSize / ((SKELETON_COLUMNS - 1) * advance)))
      const rows = Math.max(1, Math.ceil(height / fontSize))
      overlay.style.fontSize = `${fontSize}px`
      overlay.dataset.rows = String(rows)
      overlay.innerHTML = asciiSkeletonHTML({ variant: 'dither', rows, seed, css: false })
      stopShimmer = animateSkeleton(overlay.firstElementChild as HTMLElement)
    }
    overlay.hidden = false
    line.classList.add('is-loading')
    render()
    const resize = new ResizeObserver(render)
    resize.observe(line)
    return () => {
      disposed = true
      resize.disconnect()
      stopShimmer?.()
      overlay.replaceChildren()
      overlay.style.removeProperty('font-size')
      delete overlay.dataset.rows
      overlay.hidden = true
      line.classList.remove('is-loading')
    }
  }

  destroy(): void {
    this.styles.remove()
  }
}

export function sweepIn(overlay: HTMLElement, copy: HTMLElement, duration: number, delay = 0): Animation[] {
  const timing: KeyframeAnimationOptions = { duration, delay, easing: 'linear', fill: 'both' }
  return [
    overlay.animate([
      { clipPath: 'inset(0 100% 0 0)', offset: 0 },
      { clipPath: 'inset(0)', offset: 0.5 },
      { clipPath: 'inset(0 0 0 100%)', offset: 1 },
    ], timing),
    copy.animate([
      { clipPath: 'inset(0 100% 0 0)', offset: 0 },
      { clipPath: 'inset(0 100% 0 0)', offset: 0.5 },
      { clipPath: 'inset(0)', offset: 1 },
    ], timing),
  ]
}
