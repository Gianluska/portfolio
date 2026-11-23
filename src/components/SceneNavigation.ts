import { Observer } from 'gsap/Observer'
import { gsap } from '../lib/ease'
import { ScrollCue } from './ScrollCue'
import type { AsciiDither } from './AsciiDither'
import { QuestReveal } from './QuestReveal'

gsap.registerPlugin(Observer)

const TRAVEL = 4
const FADE_START = 3.15
const FADE_DURATION = TRAVEL - FADE_START
const QUEST_ENTRY = FADE_START + FADE_DURATION * 0.56
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-native-scroll]'
const DOWN: Record<string, true | undefined> = { ArrowDown: true, PageDown: true, End: true, ' ': true }
const UP: Record<string, true | undefined> = { ArrowUp: true, PageUp: true }
// Gesture distance (px) that must build up before the cue spills.
const WHEEL_INTENT = 390
const TOUCH_INTENT = 182
// Once input pauses, charge holds (s), then drains with gathering speed so separate strokes add up.
const HOLD = 0.6
const DRAIN_RAMP = 0.8
const DRAIN_RATE = 0.55
// Response of the displayed charge to new input (1/s).
const FOLLOW = 14
// Lift of the final backdrop (px) at full return intent.
const PREVIEW_UP = 96

/** Eases accumulated return intent into preview distance. */
const rubber = (ratio: number): number => 1 - (1 - Math.min(1, ratio)) ** 2

/**
 * Gesture distance building toward a transition, as a share of its threshold. Reversals drain it;
 * after a pause it lingers, then fades out instead of snapping back to zero.
 */
class Charge {
  private target = 0
  private shown = 0
  private idle = 0
  private running = false

  constructor(private readonly render: (ratio: number) => void) {}

  get value(): number {
    return this.target
  }

  /** Adds a share of the threshold (negative drains); true once it fills. */
  push(amount: number): boolean {
    this.target = Math.min(1, Math.max(0, this.target + amount))
    this.idle = 0
    if (this.target >= 1) return true
    if (!this.running && (this.target > 0 || this.shown > 0)) {
      this.running = true
      gsap.ticker.add(this.tick)
    }
    return false
  }

  /** Drops the charge without rendering; the caller owns what happens next. */
  reset(): void {
    gsap.ticker.remove(this.tick)
    this.running = false
    this.target = this.shown = this.idle = 0
  }

  private tick = (_time: number, deltaMs: number): void => {
    const dt = Math.min(deltaMs, 100) / 1000
    this.idle += dt
    if (this.idle > HOLD) {
      const speed = DRAIN_RATE * Math.min(1, (this.idle - HOLD) / DRAIN_RAMP)
      this.target = Math.max(0, this.target - speed * dt)
    }
    this.shown += (this.target - this.shown) * (1 - Math.exp(-FOLLOW * dt))
    if (this.target === 0 && this.shown < 0.002) {
      this.shown = 0
      gsap.ticker.remove(this.tick)
      this.running = false
    }
    this.render(this.shown)
  }
}

const wheelPixels = (event: WheelEvent): number =>
  event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)

type Passage = 'sea' | 'spill' | 'outbound' | 'landing' | 'inbound' | 'native'

interface SceneRefs {
  root: HTMLElement
  landing: HTMLElement
  cue: HTMLElement
}

/** Runs the camera journey between the sea and the final backdrop. */
export class SceneNavigation {
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer: Observer
  private timeline: gsap.core.Timeline | null = null
  private passage: Passage = 'native'
  private end = 1
  private readonly cue: ScrollCue
  private readonly quests: QuestReveal
  private readonly down = new Charge((ratio) => this.cue.set(ratio))
  // An upward pull reveals a sliver of the waterfall before the return.
  private readonly up = new Charge((ratio) => {
    const pull = rubber(ratio)
    if (pull === 0) gsap.set(this.refs.landing, { clearProps: 'opacity,transform' })
    else gsap.set(this.refs.landing, { y: pull * PREVIEW_UP, opacity: 1 - pull * 0.2 })
  })
  private touchX = 0
  private touchY = 0

  constructor(private readonly refs: SceneRefs, dither: AsciiDither, private readonly cover: (covered: boolean) => void) {
    this.cue = new ScrollCue(refs.cue)
    this.quests = new QuestReveal(refs.landing.querySelector<HTMLElement>('.quests')!, dither)
    refs.landing.inert = true
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
        if (this.passage !== 'sea' || !this.cue.ready) return
        const threshold = self.event?.type === 'wheel' ? WHEEL_INTENT : TOUCH_INTENT
        if (this.down.push(-self.deltaY / threshold)) this.requestDescent()
      },
    })
    this.observer.disable()
  }

  start(): void {
    this.resize()
    this.settle()
    window.addEventListener('keydown', this.key)
    window.addEventListener('scroll', this.scroll, { passive: true })
    window.addEventListener('wheel', this.wheel, { passive: false })
    window.addEventListener('touchstart', this.touchStart, { passive: true })
    window.addEventListener('touchmove', this.touchMove, { passive: false })
    window.addEventListener('resize', this.resize)
    this.motion.addEventListener('change', this.preference)
  }

  private setPassage(passage: Passage): void {
    this.passage = passage
    this.down.reset()
    this.up.reset()
    if (passage === 'sea') this.cue.show()
    else if (passage === 'spill') this.cue.spill(() => this.descend())
    else this.cue.hide()
    const locked = passage !== 'landing' && passage !== 'native'
    this.refs.landing.inert = locked
    document.documentElement.toggleAttribute('data-scene-scroll', locked)
    if (locked) this.observer.enable()
    else this.observer.disable()
  }

  private cancel(): void {
    this.down.reset()
    this.up.reset()
    this.timeline?.kill()
    this.timeline = null
    this.clearHandoff()
  }

  private clearHandoff(): void {
    this.refs.root.removeAttribute('data-scene-handoff')
    gsap.set(this.refs.landing, { clearProps: 'opacity,transform' })
  }

  private settle(): void {
    this.cancel()
    this.quests.finish()
    const reduced = this.motion.matches
    const atLanding = window.scrollY >= this.end - 2
    // Resume the sea unless the restored scroll position is already at the final backdrop.
    if (!reduced && !atLanding) window.scrollTo(0, 0)
    this.cover(atLanding)
    this.setPassage(reduced ? 'native' : atLanding ? 'landing' : 'sea')
  }

  private moveCamera(timeline: gsap.core.Timeline, from: number, to: number): gsap.core.Timeline {
    const travel = { progress: from }
    return timeline.to(travel, {
      progress: to, duration: TRAVEL, ease: 'sine.inOut',
      onUpdate: () => window.scrollTo(0, travel.progress * this.end),
    }, 0)
  }

  private requestDescent(): void {
    if (this.passage === 'sea' && this.cue.ready) this.setPassage('spill')
  }

  private descend(): void {
    if (this.passage !== 'spill' || this.motion.matches) return
    const { root, landing } = this.refs
    this.quests.prepare()
    this.setPassage('outbound')
    const timeline = gsap.timeline({ onComplete: () => {
      this.timeline = null
      window.scrollTo(0, this.end)
      this.cover(true)
      this.setPassage('landing')
      this.clearHandoff()
    } })
    this.timeline = this.moveCamera(timeline, 0, 1)
      .call(() => root.setAttribute('data-scene-handoff', ''), [], FADE_START)
      .fromTo(landing, { opacity: 0 }, {
        opacity: 1, duration: FADE_DURATION, ease: 'power2.out', immediateRender: false,
      }, FADE_START)
      .call(() => this.quests.show(), [], QUEST_ENTRY)
  }

  private ascend(): void {
    const { root, landing } = this.refs
    // Continue from the upward-pull preview, if any.
    const lift = Number(gsap.getProperty(landing, 'y')) || 0
    const fade = Number(gsap.getProperty(landing, 'opacity'))
    this.cancel()
    this.quests.pause()
    gsap.set(landing, { y: lift, opacity: Number.isFinite(fade) ? fade : 1 })
    root.setAttribute('data-scene-handoff', '')
    this.setPassage('inbound')
    window.scrollTo(0, this.end)
    this.cover(false)
    const timeline = gsap.timeline({ onComplete: () => {
      this.timeline = null
      this.setPassage('sea')
    } })
    this.timeline = this.moveCamera(timeline, 1, 0)
      .to(landing, { opacity: 0, duration: FADE_DURATION, ease: 'power2.in' }, 0)
      .call(() => {
        this.quests.finish()
        this.clearHandoff()
      }, [], FADE_DURATION)
  }

  /** Upward gestures from the final backdrop build return intent. */
  private atBrink(): boolean {
    return this.passage === 'landing' && window.scrollY <= this.end + 1
  }

  private ignored(event: Event): boolean {
    return event.target instanceof Element && Boolean(event.target.closest(EDITABLE))
  }

  private wheel = (event: WheelEvent): void => {
    if (this.passage !== 'landing' || event.ctrlKey || event.metaKey || this.ignored(event)
      || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    const delta = wheelPixels(event)
    // Scrolling back down drains a built-up pull before the page moves again.
    if (delta >= 0 && this.up.value === 0) return
    if (delta < 0 && !this.atBrink()) return
    event.preventDefault()
    if (this.up.push(-delta / WHEEL_INTENT)) this.ascend()
  }

  private touchStart = (event: TouchEvent): void => {
    const touch = event.touches[0]
    if (!touch) return
    this.touchX = touch.clientX
    this.touchY = touch.clientY
  }

  private touchMove = (event: TouchEvent): void => {
    const touch = event.touches[0]
    if (this.passage !== 'landing' || !touch || event.touches.length > 1 || this.ignored(event)) return
    const dx = touch.clientX - this.touchX
    const dy = touch.clientY - this.touchY
    this.touchX = touch.clientX
    this.touchY = touch.clientY
    if (Math.abs(dx) > Math.abs(dy)) return
    if ((dy <= 0 && this.up.value === 0) || (dy > 0 && !this.atBrink())) return
    if (event.cancelable) event.preventDefault()
    if (this.up.push(dy / TOUCH_INTENT)) this.ascend()
  }

  private scroll = (): void => {
    if (this.passage === 'native') this.cover(window.scrollY >= this.end - 2)
    else if (this.passage === 'landing' && window.scrollY < this.end - 2) {
      // Momentum overshooting the brink is held there; a deliberate jump (scrollbar drag) still ascends.
      if (this.end - window.scrollY > window.innerHeight / 2) this.ascend()
      else window.scrollTo(0, this.end)
    }
  }

  private resize = (): void => {
    this.end = Math.max(1, this.refs.landing.offsetTop)
    if (this.passage === 'landing' && window.scrollY < this.end) window.scrollTo(0, this.end)
  }

  private preference = (): void => {
    this.resize()
    if (this.passage === 'outbound') window.scrollTo(0, this.end)
    else if (this.passage === 'inbound') window.scrollTo(0, 0)
    this.settle()
  }

  private key = (event: KeyboardEvent): void => {
    if (this.passage === 'native' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof Element && (event.target.closest(EDITABLE)
      || (event.key === ' ' && event.target.closest('a, button')))) return
    if (this.passage === 'landing') {
      if ((event.key === 'Home' && !event.shiftKey)
        || (this.atBrink() && (UP[event.key] || (event.key === ' ' && event.shiftKey)))) {
        event.preventDefault()
        this.ascend()
      }
      return
    }
    if (event.key === 'Escape' && (this.timeline || this.passage === 'spill')) {
      event.preventDefault()
      window.scrollTo(0, this.passage === 'inbound' ? this.end : 0)
      this.settle()
    } else if (DOWN[event.key] && !(event.key === ' ' && event.shiftKey)) {
      event.preventDefault()
      if (!event.repeat) this.requestDescent()
    }
  }

  destroy(): void {
    this.cancel()
    this.cue.destroy()
    this.quests.destroy()
    this.refs.landing.inert = false
    this.observer.kill()
    window.removeEventListener('keydown', this.key)
    window.removeEventListener('scroll', this.scroll)
    window.removeEventListener('wheel', this.wheel)
    window.removeEventListener('touchstart', this.touchStart)
    window.removeEventListener('touchmove', this.touchMove)
    window.removeEventListener('resize', this.resize)
    this.motion.removeEventListener('change', this.preference)
    document.documentElement.removeAttribute('data-scene-scroll')
  }
}
