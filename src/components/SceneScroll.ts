import { smooth } from './SceneGeometry'

const ASCEND_AT = 0.65
const DESCEND_AT = 0.35

function stripMask(top: number, firstEnd: number, secondStart: number, secondEnd: number, thirdStart: number): string {
  return `polygon(0 ${top}%, 100% ${top}%, 100% ${firstEnd}%, 0 ${firstEnd}%,
    0 ${secondStart}%, 100% ${secondStart}%, 100% ${secondEnd}%, 0 ${secondEnd}%,
    0 ${thirdStart}%, 100% ${thirdStart}%, 100% 100%, 0 100%)`
}

// Identical polygon topology at every keyframe: the gaps open smoothly instead of blinking.
const LAUNCH_GLITCH: Keyframe[] = [
  { offset: 0, transform: 'translate(0, 0)', clipPath: stripMask(0, 32, 32, 65, 65), opacity: 1 },
  { offset: 0.21, transform: 'translate(-4px, 7px)', clipPath: stripMask(0, 30, 36, 63, 71), opacity: 1 },
  { offset: 0.42, transform: 'translate(5px, 17px)', clipPath: stripMask(8, 28, 40, 58, 77), opacity: 0.88 },
  { offset: 0.62, transform: 'translate(-3px, 28px)', clipPath: stripMask(24, 28, 45, 56, 84), opacity: 0.56 },
  { offset: 0.90, transform: 'translate(0, 42px)', clipPath: stripMask(28, 28, 53, 53, 100), opacity: 0 },
  { offset: 1, transform: 'translate(0, 42px)', clipPath: stripMask(28, 28, 53, 53, 100), opacity: 0 },
]

/** Native scroll supplies direction and intent, never the camera's playhead. */
export class SceneScroll {
  private inSpace = false
  private moveFocus = false
  private readonly ascend: HTMLButtonElement
  private readonly descend: HTMLButtonElement
  private readonly spaceTitle: HTMLElement
  private readonly heroLines: NodeListOf<HTMLElement>
  private readonly glitch: Animation[] = []
  private meadowOpacity = 1
  private spaceOpacity = 0
  private launchProgress = 0

  constructor(
    private readonly meadow: HTMLElement,
    private readonly space: HTMLElement,
    private readonly onDestination: (inSpace: boolean) => void,
    private readonly onMeadowVisible: (visible: boolean) => void,
  ) {
    this.ascend = meadow.querySelector<HTMLButtonElement>('.scene-button')!
    this.descend = space.querySelector<HTMLButtonElement>('.scene-button')!
    this.spaceTitle = space.querySelector('h2')!
    this.heroLines = meadow.querySelectorAll<HTMLElement>('.hero__line')
    this.ascend.addEventListener('click', this.goUp)
    this.descend.addEventListener('click', this.goDown)
    window.addEventListener('scroll', this.readScroll, { passive: true })
    window.addEventListener('resize', this.readScroll, { passive: true })
    this.readScroll()
  }

  private scrollRange(): number {
    const root = document.documentElement
    return root.scrollHeight - root.clientHeight
  }

  private readScroll = (): void => {
    const range = this.scrollRange()
    if (range <= 0) return
    const position = window.scrollY / range
    const destination = this.inSpace ? position > DESCEND_AT : position >= ASCEND_AT
    if (destination === this.inSpace) return
    this.inSpace = destination
    this.onDestination(destination)
  }

  private jump(top: number): void {
    this.moveFocus = true
    window.scrollTo({ top, behavior: 'instant' })
    this.readScroll()
  }

  private goUp = (): void => { this.jump(this.scrollRange()) }
  private goDown = (): void => { this.jump(0) }

  paint(altitude: number, settled: boolean, launch: number): void {
    const meadowOpacity = (1 - smooth((altitude - 0.025) / 0.23)) * (1 - smooth((launch - 0.48) / 0.48))
    const spaceOpacity = smooth((altitude - 0.72) / 0.24)
    if (this.meadowOpacity !== meadowOpacity) {
      this.meadowOpacity = meadowOpacity
      this.meadow.style.opacity = `${meadowOpacity}`
    }
    const meadowActive = meadowOpacity > 0 && launch === 0
    if (this.setInert(this.meadow, !meadowActive)) this.onMeadowVisible(meadowActive)
    this.paintGlitch(launch)
    if (this.spaceOpacity !== spaceOpacity) {
      this.spaceOpacity = spaceOpacity
      this.space.style.opacity = `${spaceOpacity}`
      this.spaceTitle.style.transform = spaceOpacity < 1 ? `translateY(${-14 * (1 - spaceOpacity)}px)` : ''
      this.setInert(this.space, spaceOpacity === 0)
    }
    if (this.moveFocus && settled) {
      this.moveFocus = false
      const view = altitude === 0 ? this.meadow : this.space
      view.focus({ preventScroll: true })
    }
  }

  private paintGlitch(progress: number): void {
    if (progress === this.launchProgress) return
    this.launchProgress = progress
    if (progress === 0) {
      for (const animation of this.glitch) animation.cancel()
      this.glitch.length = 0
      return
    }

    // The Canvas clock scrubs this effect so an interrupted launch restores the same text.
    if (!this.glitch.length) {
      for (const line of this.heroLines) {
        const animation = line.animate(LAUNCH_GLITCH, { duration: 1000, fill: 'both' })
        animation.pause()
        this.glitch.push(animation)
      }
    }
    for (let i = 0; i < this.glitch.length; i++) {
      this.glitch[i].currentTime = Math.max(0, progress - 0.04 * i) * 1000
    }
  }

  private setInert(view: HTMLElement, inert: boolean): boolean {
    if (view.inert === inert) return false
    if (inert && view.contains(document.activeElement)) this.moveFocus = true
    view.inert = inert
    return true
  }

  destroy(): void {
    this.paintGlitch(0)
    this.ascend.removeEventListener('click', this.goUp)
    this.descend.removeEventListener('click', this.goDown)
    window.removeEventListener('scroll', this.readScroll)
    window.removeEventListener('resize', this.readScroll)
  }
}
