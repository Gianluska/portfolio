import { Observer } from 'gsap/Observer'
import { gsap } from '../lib/ease'

gsap.registerPlugin(Observer)

type Scene = 0 | 1
const KEY_SCENE: Record<string, Scene | undefined> = {
  ArrowDown: 1, PageDown: 1, End: 1, ' ': 1,
  ArrowUp: 0, PageUp: 0, Home: 0,
}
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-native-scroll]'

/** Gestures choose a scene; one tween owns the entire camera journey between endpoints. */
export class SceneNavigation {
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer: Observer
  private tween: gsap.core.Tween | null = null
  private scene: Scene = 0
  private started = false

  constructor(private readonly projects: HTMLElement, private readonly menu: HTMLElement) {
    this.observer = Observer.create({
      id: 'portfolio-scenes',
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
      onUp: () => this.goTo(1),
      onDown: () => this.goTo(0),
    })
    this.observer.disable()
    menu.addEventListener('click', this.navigateProjects)
    window.addEventListener('keydown', this.key)
    window.addEventListener('pageshow', this.home)
    window.addEventListener('hashchange', this.home)
    window.addEventListener('resize', this.resize)
    this.motion.addEventListener('change', this.preference)
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.preference()
    this.goTo(0, true, true)
  }

  private end(): number {
    return Math.max(1, this.projects.getBoundingClientRect().top + window.scrollY)
  }

  private goTo(scene: Scene, immediate = false, force = false): void {
    if (!this.started || (!force && (this.tween || scene === this.scene))) return
    this.tween?.kill()
    this.tween = null
    this.scene = scene
    const end = this.end()
    const destination = scene * end
    const position = { y: window.scrollY }
    const distance = Math.abs(destination - position.y)
    if (immediate || this.motion.matches || distance < 1) {
      window.scrollTo(0, destination)
      return
    }
    this.tween = gsap.to(position, {
      y: destination,
      duration: Math.max(0.4, 3.2 * distance / end),
      ease: 'sine.inOut',
      onUpdate: () => window.scrollTo(0, position.y),
      onComplete: () => { this.tween = null },
    })
  }

  private navigateProjects = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || !(event.target instanceof Element)
      || !event.target.closest('button[data-scene="projects"]') || !this.started) return
    event.preventDefault()
    if (this.motion.matches) this.goTo(1, true, true)
    else this.goTo(1)
  }

  private key = (event: KeyboardEvent): void => {
    if (!this.started || this.motion.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof Element && (event.target.closest(EDITABLE)
      || (event.key === ' ' && event.target.closest('a, button')))) return
    if (event.key === 'Escape' && this.tween) {
      event.preventDefault()
      this.goTo(window.scrollY > this.end() / 2 ? 1 : 0, true, true)
      return
    }
    const scene = event.key === ' ' && event.shiftKey ? 0 : KEY_SCENE[event.key]
    if (scene === undefined) return
    event.preventDefault()
    if (!event.repeat) this.goTo(scene)
  }

  private home = (): void => {
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
    this.goTo(0, true, true)
  }

  private resize = (): void => {
    if (!this.motion.matches) this.goTo(this.scene, true, true)
  }

  private preference = (event?: MediaQueryListEvent): void => {
    if (!this.started) return
    if (event) this.scene = window.scrollY > this.end() / 2 ? 1 : 0
    this.tween?.kill()
    this.tween = null
    if (this.motion.matches) {
      this.observer.disable()
      document.documentElement.dataset.scrollMode = 'native'
    } else {
      this.observer.enable()
      document.documentElement.dataset.scrollMode = 'snap'
      if (event) this.goTo(this.scene, true, true)
    }
  }

  destroy(): void {
    this.started = false
    this.tween?.kill()
    this.observer.kill()
    this.menu.removeEventListener('click', this.navigateProjects)
    window.removeEventListener('keydown', this.key)
    window.removeEventListener('pageshow', this.home)
    window.removeEventListener('hashchange', this.home)
    window.removeEventListener('resize', this.resize)
    this.motion.removeEventListener('change', this.preference)
    delete document.documentElement.dataset.scrollMode
  }
}
