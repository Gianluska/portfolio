import { Observer } from 'gsap/Observer'
import { gsap } from '../lib/ease'

gsap.registerPlugin(Observer)

const TRAVEL = 4
const TEXT_IN = 3.15
const HANDOFF_DURATION = TRAVEL - TEXT_IN
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-native-scroll]'
const DOWN: Record<string, true | undefined> = { ArrowDown: true, PageDown: true, End: true, ' ': true }
const UP: Record<string, true | undefined> = { ArrowUp: true, PageUp: true }
// Gesture distance (px) that must build up before the camera crosses the waterfall.
const WHEEL_INTENT = 600
const TOUCH_INTENT = 240
// Without new input for this long (ms), an unfinished gesture springs back and starts over.
const BOUNCE_DELAY = 220
// Rubber-band preview at full intent: share of the camera journey, and lift of the content (px).
const PREVIEW_DOWN = 0.09
const PREVIEW_UP = 96

/** Eases accumulated intent into preview distance: quick to respond, resisting near the threshold. */
const rubber = (ratio: number): number => 1 - (1 - Math.min(1, ratio)) ** 2

/** Accumulates gesture distance toward a transition; a reversal starts over. */
class Intent {
  private total = 0

  get value(): number {
    return this.total
  }

  push(amount: number, threshold: number): boolean {
    if (amount <= 0) {
      this.total = 0
      return false
    }
    this.total += amount
    if (this.total < threshold) return false
    this.total = 0
    return true
  }

  reset(): void {
    this.total = 0
  }
}

const wheelPixels = (event: WheelEvent): number =>
  event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)

type Passage = 'sea' | 'outbound' | 'work' | 'inbound' | 'native'

interface SceneRefs {
  root: HTMLElement
  projects: HTMLElement
  home: HTMLElement
  portfolio: HTMLElement
}

/** One camera journey, with native scrolling once the editorial surface arrives. */
export class SceneNavigation {
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer: Observer
  private readonly reveal: IntersectionObserver
  private readonly blocks: NodeListOf<HTMLElement>
  private timeline: gsap.core.Timeline | null = null
  private passage: Passage = 'native'
  private end = 1
  private readonly downIntent = new Intent()
  private readonly upIntent = new Intent()
  private touchX = 0
  private touchY = 0
  private readonly drag = { scroll: 0 }
  private preview: gsap.core.Tween | null = null
  private bounceTimer = 0

  constructor(private readonly refs: SceneRefs, private readonly cover: (covered: boolean) => void) {
    this.blocks = refs.root.querySelectorAll('[data-reveal]')
    this.reveal = new IntersectionObserver((entries, observer) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue
        target.setAttribute('data-entered', '')
        observer.unobserve(target)
      }
    }, { rootMargin: '0px 0px -48px', threshold: 0 })

    this.observer = Observer.create({
      target: window,
      type: 'wheel,touch',
      wheelSpeed: -1,
      tolerance: 18,
      dragMinimum: 30,
      lockAxis: true,
      preventDefault: true,
      allowClicks: true,
      ignoreCheck: (event: Event) => Boolean(
        (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey
        || (event as TouchEvent).touches?.length > 1
        || (event instanceof WheelEvent && Math.abs(event.deltaX) > Math.abs(event.deltaY))
        || (event.target instanceof Element && event.target.closest(EDITABLE)),
      ),
      onChangeY: (self) => {
        if (this.passage !== 'sea') return
        const threshold = self.event?.type === 'wheel' ? WHEEL_INTENT : TOUCH_INTENT
        if (this.downIntent.push(-self.deltaY, threshold)) {
          this.stopPreview()
          this.descend()
        } else if (this.downIntent.value > 0) this.previewDown(this.downIntent.value / threshold)
        else this.bounceBack()
      },
    })
    this.observer.disable()
  }

  start(): void {
    this.resize()
    this.settle()
    this.refs.home.addEventListener('click', this.returnHome)
    window.addEventListener('keydown', this.key)
    window.addEventListener('scroll', this.scroll, { passive: true })
    window.addEventListener('wheel', this.wheel, { passive: false })
    window.addEventListener('touchstart', this.touchStart, { passive: true })
    window.addEventListener('touchmove', this.touchMove, { passive: false })
    window.addEventListener('touchend', this.bounceBack, { passive: true })
    window.addEventListener('touchcancel', this.bounceBack, { passive: true })
    window.addEventListener('resize', this.resize)
    this.motion.addEventListener('change', this.preference)
  }

  private setPassage(passage: Passage): void {
    this.passage = passage
    this.downIntent.reset()
    this.upIntent.reset()
    const locked = passage !== 'work' && passage !== 'native'
    document.documentElement.toggleAttribute('data-scene-scroll', locked)
    this.refs.portfolio.inert = locked
    if (locked) {
      this.reveal.disconnect()
      this.observer.enable()
    } else {
      this.observer.disable()
      if (passage === 'work') this.watchReveals()
      else this.reveal.disconnect()
    }
  }

  private watchReveals(): void {
    for (const block of this.blocks) {
      if (!block.hasAttribute('data-entered')) this.reveal.observe(block)
    }
  }

  private cancel(): void {
    this.stopPreview()
    this.timeline?.kill()
    this.timeline = null
    this.clearHandoff()
  }

  private clearHandoff(): void {
    this.refs.root.removeAttribute('data-scene-handoff')
    gsap.set(this.refs.portfolio, { clearProps: 'opacity,transform' })
  }

  private settle(): void {
    this.cancel()
    const { root } = this.refs
    const reduced = this.motion.matches
    const atWork = window.scrollY >= this.end - 2
    root.toggleAttribute('data-reveal-ready', !reduced)
    this.cover(atWork)
    this.setPassage(reduced ? 'native' : atWork ? 'work' : 'sea')
  }

  private moveCamera(timeline: gsap.core.Timeline, from: number, to: number): gsap.core.Timeline {
    const travel = { progress: from }
    return timeline.to(travel, {
      progress: to, duration: TRAVEL, ease: 'sine.inOut',
      onUpdate: () => window.scrollTo(0, travel.progress * this.end),
    }, 0)
  }

  private stopPreview(): void {
    this.preview?.kill()
    this.preview = null
    clearTimeout(this.bounceTimer)
  }

  private armBounce(): void {
    clearTimeout(this.bounceTimer)
    this.bounceTimer = window.setTimeout(this.bounceBack, BOUNCE_DELAY)
  }

  /** The camera leans toward the waterfall as downward intent builds at the sea. */
  private previewDown(ratio: number): void {
    this.preview?.kill()
    this.drag.scroll = window.scrollY
    this.preview = gsap.to(this.drag, {
      scroll: rubber(ratio) * PREVIEW_DOWN * this.end, duration: 0.3, ease: 'power2.out',
      onUpdate: () => window.scrollTo(0, this.drag.scroll),
    })
    this.armBounce()
  }

  /** The content sinks and dims as upward intent builds at its top edge. */
  private previewUp(ratio: number): void {
    this.preview?.kill()
    const pull = rubber(ratio)
    this.preview = gsap.to(this.refs.portfolio, {
      y: pull * PREVIEW_UP, opacity: 1 - pull * 0.2, duration: 0.3, ease: 'power2.out',
    })
    this.armBounce()
  }

  /** An unfinished gesture springs back to rest. */
  private bounceBack = (): void => {
    this.stopPreview()
    this.downIntent.reset()
    this.upIntent.reset()
    if (this.passage === 'sea' && window.scrollY > 0) {
      this.drag.scroll = window.scrollY
      this.preview = gsap.to(this.drag, {
        scroll: 0, duration: 0.65, ease: 'power3.out',
        onUpdate: () => window.scrollTo(0, this.drag.scroll),
      })
    } else if (this.passage === 'work' && gsap.getProperty(this.refs.portfolio, 'y') !== 0) {
      this.preview = gsap.to(this.refs.portfolio, {
        y: 0, opacity: 1, duration: 0.7, ease: 'back.out(2.2)', clearProps: 'opacity,transform',
      })
    }
  }

  private descend(): void {
    if (this.passage !== 'sea') return
    this.stopPreview()
    const { root, portfolio } = this.refs
    for (const block of this.blocks) {
      if (block.dataset.reveal === 'arrival') block.removeAttribute('data-entered')
    }
    this.setPassage('outbound')
    const timeline = gsap.timeline({ onComplete: () => {
      this.timeline = null
      window.scrollTo(0, this.end)
      this.cover(true)
      this.setPassage('work')
      this.clearHandoff()
    } })
    this.timeline = this.moveCamera(timeline, window.scrollY / this.end, 1)
      .call(() => {
        root.setAttribute('data-scene-handoff', '')
        this.watchReveals()
      }, [], TEXT_IN)
      .fromTo(portfolio, { opacity: 0 }, {
        opacity: 1, duration: HANDOFF_DURATION, ease: 'power2.out', immediateRender: false,
      }, TEXT_IN)
  }

  private ascend(): void {
    const { root, portfolio } = this.refs
    // Continue from the rubber-band preview, if any.
    const lift = Number(gsap.getProperty(portfolio, 'y')) || 0
    const fade = Number(gsap.getProperty(portfolio, 'opacity'))
    this.cancel()
    // On a Home/brand jump from deeper content, keep that content in view for the fade.
    const offset = Math.min(0, this.end - window.scrollY) + lift
    gsap.set(portfolio, { y: offset, opacity: Number.isFinite(fade) ? fade : 1 })
    root.setAttribute('data-scene-handoff', '')
    this.setPassage('inbound')
    window.scrollTo(0, this.end)
    this.cover(false)
    const timeline = gsap.timeline({ onComplete: () => {
      this.timeline = null
      this.setPassage('sea')
    } })
    this.timeline = this.moveCamera(timeline, 1, 0)
      .to(portfolio, { opacity: 0, duration: HANDOFF_DURATION, ease: 'power2.in' }, 0)
      .call(() => this.clearHandoff(), [], HANDOFF_DURATION)
  }

  /** At the top of the editorial surface, upward gestures build intent instead of scrolling. */
  private atBrink(): boolean {
    return this.passage === 'work' && window.scrollY <= this.end + 1
  }

  private ignored(event: Event): boolean {
    return event.target instanceof Element && Boolean(event.target.closest(EDITABLE))
  }

  private wheel = (event: WheelEvent): void => {
    if (this.passage !== 'work' || event.ctrlKey || event.metaKey || this.ignored(event)
      || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    const delta = wheelPixels(event)
    if (delta >= 0) {
      if (this.upIntent.value > 0) this.bounceBack()
      return
    }
    if (!this.atBrink()) return
    event.preventDefault()
    if (this.upIntent.push(-delta, WHEEL_INTENT)) this.ascend()
    else this.previewUp(this.upIntent.value / WHEEL_INTENT)
  }

  private touchStart = (event: TouchEvent): void => {
    const touch = event.touches[0]
    if (!touch) return
    this.touchX = touch.clientX
    this.touchY = touch.clientY
  }

  private touchMove = (event: TouchEvent): void => {
    const touch = event.touches[0]
    if (this.passage !== 'work' || !touch || event.touches.length > 1 || this.ignored(event)) return
    const dx = touch.clientX - this.touchX
    const dy = touch.clientY - this.touchY
    this.touchX = touch.clientX
    this.touchY = touch.clientY
    if (Math.abs(dx) > Math.abs(dy)) return
    if (dy <= 0) {
      if (this.upIntent.value > 0) this.bounceBack()
      return
    }
    if (!this.atBrink()) return
    if (event.cancelable) event.preventDefault()
    if (this.upIntent.push(dy, TOUCH_INTENT)) this.ascend()
    else this.previewUp(this.upIntent.value / TOUCH_INTENT)
  }

  private scroll = (): void => {
    if (this.passage === 'native') this.cover(window.scrollY >= this.end - 2)
    else if (this.passage === 'work' && window.scrollY < this.end - 2) {
      // Momentum overshooting the brink is held there; a deliberate jump (scrollbar drag) still ascends.
      if (this.end - window.scrollY > window.innerHeight / 2) this.ascend()
      else window.scrollTo(0, this.end)
    }
  }

  private resize = (): void => {
    this.end = Math.max(1, Math.round(this.refs.projects.getBoundingClientRect().top + window.scrollY))
    if (this.passage === 'work' && window.scrollY < this.end) window.scrollTo(0, this.end)
  }

  private preference = (): void => {
    this.resize()
    if (this.passage === 'outbound') window.scrollTo(0, this.end)
    else if (this.passage === 'inbound') window.scrollTo(0, 0)
    this.settle()
  }

  private returnHome = (): void => {
    if (this.passage === 'work') this.ascend()
    else if (this.passage === 'native') window.scrollTo(0, 0)
    else if (this.passage === 'outbound') {
      window.scrollTo(0, 0)
      this.settle()
    }
  }

  private key = (event: KeyboardEvent): void => {
    if (this.passage === 'native' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof Element && (event.target.closest(EDITABLE)
      || (event.key === ' ' && event.target.closest('a, button')))) return
    if (this.passage === 'work') {
      if ((event.key === 'Home' && !event.shiftKey)
        || (this.atBrink() && (UP[event.key] || (event.key === ' ' && event.shiftKey)))) {
        event.preventDefault()
        this.ascend()
      }
      return
    }
    if (event.key === 'Escape' && this.timeline) {
      event.preventDefault()
      window.scrollTo(0, this.passage === 'inbound' ? this.end : 0)
      this.settle()
    } else if (DOWN[event.key] && !(event.key === ' ' && event.shiftKey)) {
      event.preventDefault()
      if (!event.repeat) this.descend()
    }
  }

  destroy(): void {
    this.cancel()
    this.observer.kill()
    this.refs.portfolio.inert = false
    this.refs.root.removeAttribute('data-reveal-ready')
    this.reveal.disconnect()
    this.refs.home.removeEventListener('click', this.returnHome)
    window.removeEventListener('keydown', this.key)
    window.removeEventListener('scroll', this.scroll)
    window.removeEventListener('wheel', this.wheel)
    window.removeEventListener('touchstart', this.touchStart)
    window.removeEventListener('touchmove', this.touchMove)
    window.removeEventListener('touchend', this.bounceBack)
    window.removeEventListener('touchcancel', this.bounceBack)
    window.removeEventListener('resize', this.resize)
    this.motion.removeEventListener('change', this.preference)
    document.documentElement.removeAttribute('data-scene-scroll')
  }
}
