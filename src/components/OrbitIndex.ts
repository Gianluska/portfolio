import { gsap, riseEase, setEase } from '../lib/ease'
import { limbAt, limbCurve, smooth, SUN_AT_REST, sunRadius } from './SceneGeometry'
import type { WorkItem } from '../data/work'

/** EarthSurface maps a column to the bearing asin(u * 0.57); near the center that is linear. */
const BEARING_PER_SPAN = 0.57
const TURN_SECONDS = 0.95
const ENTER_AT = 0.94
const LEAVE_AT = 0.9
const SET_SECONDS = 0.34
const RISE_SECONDS = 1.05
const BELOW_HORIZON = 135
const WHEEL_STEP = 24
const SWIPE = 48
/** The title stands on the top of the bright rim rather than its center line. */
const HORIZON_INSET = 0.034
const SVG = 'http://www.w3.org/2000/svg'

export interface OrbitHandlers {
  turn(radians: number): void
  pulse(): void
  descend(): void
}

interface Drag {
  id: number
  x: number
  y: number
  start: number
  horizontal: boolean | null
  lastPosition: number
  lastTime: number
  velocity: number
}

const rubber = (overflow: number): number => 0.3 * overflow / (1 + overflow)

/**
 * Work items orbit along the Earth's limb. Turning the planet brings one under the sun; its title
 * rises from behind the horizon and its details are charted in the sky like labelled stars.
 */
export class OrbitIndex {
  private readonly items: HTMLElement[]
  private readonly buttons: HTMLButtonElement[]
  private readonly labels: HTMLElement[]
  private readonly notes: HTMLElement[]
  private readonly values: HTMLElement[]
  private readonly link: HTMLAnchorElement
  private readonly chart: SVGSVGElement
  private readonly titleFrame: HTMLElement
  private readonly heading: HTMLElement
  private readonly title: HTMLElement
  private readonly status: HTMLElement
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly observer = new ResizeObserver(() => this.resize())
  private width = 0
  private height = 0
  private curve = 0
  private altitude = 0
  private interactive = false
  private entered = false
  private index = 0
  /** Fractional item currently under the sun. */
  private position = 0
  /** Item whose title and notes are on screen, or -1. */
  private shown = -1
  private turnTween: gsap.core.Animation | null = null
  private story: gsap.core.Timeline | null = null
  private chartStory: gsap.core.Timeline | null = null
  private wheelDelta = 0
  private lastWheel = 0
  private wheelQuietUntil = 0
  private drag: Drag | null = null
  private dragged = false

  constructor(
    private readonly space: HTMLElement,
    private readonly work: WorkItem[],
    private readonly handlers: OrbitHandlers,
  ) {
    this.items = [...space.querySelectorAll<HTMLElement>('.orbit-item')]
    this.buttons = this.items.map((item) => item.querySelector('button')!)
    this.labels = this.items.map((item) => item.querySelector<HTMLElement>('.orbit-item__label')!)
    this.notes = [...space.querySelectorAll<HTMLElement>('.orbit-note')]
    this.values = this.notes.map((note) => note.querySelector('dd')!)
    this.link = space.querySelector<HTMLAnchorElement>('.orbit-note a')!
    this.chart = space.querySelector<SVGSVGElement>('.orbit-chart')!
    this.titleFrame = space.querySelector<HTMLElement>('.orbit-title')!
    this.heading = this.titleFrame.querySelector('h3')!
    this.title = space.querySelector<HTMLElement>('.orbit-title__text')!
    this.status = space.querySelector<HTMLElement>('.orbit-status')!
    gsap.set(this.title, { yPercent: BELOW_HORIZON })
    gsap.set([...this.notes, this.chart], { autoAlpha: 0 })

    this.buttons.forEach((button, i) => button.addEventListener('click', () => this.select(i, true)))
    space.addEventListener('click', this.swallowClick, true)
    space.addEventListener('pointerdown', this.pointerDown)
    space.addEventListener('pointermove', this.pointerMove)
    space.addEventListener('pointerup', this.pointerUp)
    space.addEventListener('pointercancel', this.pointerCancel)
    window.addEventListener('wheel', this.wheel, { passive: false })
    window.addEventListener('keydown', this.keydown)
    this.observer.observe(space)
  }

  /** Follows the camera: the arc rides the limb in, and the work is told once the camera brakes. */
  paint(altitude: number, settled: boolean): void {
    this.altitude = altitude
    const interactive = settled && altitude === 1
    if (interactive !== this.interactive) {
      this.interactive = interactive
      this.space.classList.toggle('is-orbiting', interactive)
      if (!interactive) this.endDrag()
    }
    if (!this.entered && altitude >= ENTER_AT) this.enter()
    else if (this.entered && altitude < LEAVE_AT) this.leave()
    this.layoutArc()
  }

  private get gap(): number {
    // Wide frames show two neighbours on each side; narrow ones keep only the nearest pair.
    return this.width >= 760 ? 0.42 : Math.min(0.62, 1 - 170 / this.width)
  }

  private resize(): void {
    const { width, height } = this.space.getBoundingClientRect()
    if (!width || !height || (width === this.width && height === this.height)) return
    this.width = width
    this.height = height
    this.curve = limbCurve(width, height)
    this.layoutArc()
    if (this.shown >= 0) this.layoutNotes()
  }

  private layoutArc = (): void => {
    const w = this.width, h = this.height
    if (!w) return
    const { rim, depth } = limbAt(this.altitude, h)
    const bulge = this.curve * depth
    const gap = this.gap
    const offset = Math.min(64, Math.max(38, h * 0.06))
    for (let i = 0; i < this.items.length; i++) {
      const away = i - this.position
      const u = away * gap
      const fade = 1 - smooth((Math.abs(u) - 0.84) / 0.18)
      const item = this.items[i]
      item.style.visibility = fade > 0 ? 'visible' : 'hidden'
      if (fade <= 0) continue
      // Each label leans with the tangent of the limb at its point.
      const angle = Math.atan(4 * bulge * u / w)
      item.style.transform = `translate(${(u + 1) * w / 2}px, ${rim + bulge * u * u + offset}px) rotate(${angle}rad)`
      item.style.opacity = `${fade}`
      this.labels[i].style.opacity = `${smooth((Math.abs(away) - 0.2) / 0.45)}`
    }
    this.handlers.turn(this.position * gap * BEARING_PER_SPAN)

    // The title stands on the horizon; everything below the glowing rim is hidden by the planet.
    const horizon = rim - depth * HORIZON_INSET
    this.titleFrame.style.height = `${horizon}px`
    let clip = `polygon(0 ${-h}px, ${w}px ${-h}px`
    for (let step = 0; step <= 24; step++) {
      const u = 1 - step / 12
      // Follow the limb only loosely so descenders never spill onto the glow at the ends.
      clip += `, ${(u + 1) * w / 2}px ${horizon + 0.35 * bulge * u * u}px`
    }
    this.titleFrame.style.clipPath = `${clip})`
  }

  /** Charts the selected item's details as stars in the sky between the sun and its title. */
  private layoutNotes(): void {
    const w = this.width, h = this.height
    const item = this.work[this.shown]
    const { rim, depth } = limbAt(1, h)
    const top = h * SUN_AT_REST + sunRadius(w, h) * 1.6
    const bottom = rim - depth * HORIZON_INSET - this.heading.offsetHeight - Math.max(20, h * 0.04)
    const row = Math.max(26, (bottom - top) / this.notes.length)
    const margin = Math.min(40, Math.max(18, w * 0.024))
    const narrow = w < 760
    const stars: [number, number][] = []
    this.notes.forEach((note, i) => {
      const lane = item.chart[i]
      // Wide frames hang the stars beneath the sun and write outward; narrow ones keep a gutter.
      const outward = !narrow && lane < 0.5
      const x = narrow
        ? margin + 6 + lane * 0.12 * w
        : w * (lane < 0.5 ? 0.44 - (0.5 - lane) * 0.4 : 0.56 + (lane - 0.5) * 0.4)
      const y = top + row * (i + 0.5)
      stars.push([x, y])
      note.style.left = outward ? '' : `${x + 14}px`
      note.style.right = outward ? `${w - x + 14}px` : ''
      note.style.top = `${y - 8}px`
      note.style.maxWidth = `${Math.max(120, outward ? x - 14 - margin : w - x - 14 - margin)}px`
      note.style.textAlign = outward ? 'right' : 'left'
      note.dataset.side = outward ? 'left' : 'right'
    })

    this.chart.replaceChildren()
    const d = stars.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('')
    // A solid copy of the route draws the dotted line in through a mask.
    const mask = document.createElementNS(SVG, 'mask')
    mask.id = 'orbit-chart-mask'
    mask.setAttribute('maskUnits', 'userSpaceOnUse')
    const reveal = document.createElementNS(SVG, 'path')
    reveal.setAttribute('d', d)
    reveal.setAttribute('fill', 'none')
    reveal.setAttribute('stroke', '#fff')
    reveal.setAttribute('stroke-width', '4')
    reveal.classList.add('orbit-chart__reveal')
    mask.append(reveal)
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', d)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', 'currentColor')
    path.setAttribute('stroke-opacity', '0.32')
    path.setAttribute('stroke-dasharray', '2 5')
    path.setAttribute('mask', 'url(#orbit-chart-mask)')
    this.chart.append(mask, path)
    for (const [x, y] of stars) {
      const star = document.createElementNS(SVG, 'path')
      star.setAttribute('d', `M${x - 3.5} ${y}H${x + 3.5}M${x} ${y - 3.5}V${y + 3.5}`)
      star.setAttribute('stroke', 'currentColor')
      star.classList.add('orbit-chart__star')
      this.chart.append(star)
    }
  }

  private fill(i: number): void {
    const item = this.work[i]
    this.shown = i
    this.title.textContent = item.name
    const [period, role, summary, stack] = this.values
    period.textContent = item.period
    role.textContent = item.role
    summary.textContent = item.summary
    stack.textContent = item.stack.join(' · ')
    this.link.href = item.link.href
    this.link.textContent = `${item.link.label} `
    const arrow = document.createElement('span')
    arrow.setAttribute('aria-hidden', 'true')
    arrow.textContent = '↗'
    this.link.append(arrow)
    this.layoutNotes()
  }

  private enter(): void {
    this.entered = true
    this.turnTween?.kill()
    this.position = this.index
    this.tell()
  }

  private leave(): void {
    this.entered = false
    this.story?.kill()
    this.chartStory?.kill()
    this.turnTween?.kill()
    this.position = this.index
    this.shown = -1
    if (this.motion.matches) {
      gsap.set(this.title, { yPercent: BELOW_HORIZON })
      gsap.set([...this.notes, this.chart], { autoAlpha: 0 })
      return
    }
    this.story = gsap.timeline()
      .to(this.title, { yPercent: BELOW_HORIZON, duration: SET_SECONDS, ease: setEase }, 0)
      .to([...this.notes, this.chart], { autoAlpha: 0, duration: 0.2, ease: setEase }, 0)
  }

  private select(next: number, fromPointer = false): void {
    next = Math.max(0, Math.min(this.work.length - 1, next))
    const changed = next !== this.index
    const keepFocus = this.space.querySelector('.orbit-list')!.contains(document.activeElement)
    this.index = next
    this.buttons.forEach((button, i) => {
      button.tabIndex = i === next ? 0 : -1
      button.setAttribute('aria-current', `${i === next}`)
    })
    if (keepFocus && !fromPointer) this.buttons[next].focus({ preventScroll: true })
    this.spin(next)
    if (!changed) return
    this.status.textContent = `${next + 1} of ${this.work.length}: ${this.work[next].name}`
    this.tell()
  }

  private step(direction: number): void {
    const next = this.index + direction
    if (next < 0 || next >= this.work.length) this.bump(direction)
    else this.select(next)
  }

  private spin(target: number): void {
    this.turnTween?.kill()
    const distance = Math.abs(target - this.position)
    if (this.motion.matches || distance < 0.001) {
      this.position = target
      this.layoutArc()
      return
    }
    this.turnTween = gsap.to(this, {
      position: target,
      duration: TURN_SECONDS * Math.min(1.7, Math.max(0.5, Math.sqrt(distance))),
      ease: 'orbit',
      onUpdate: this.layoutArc,
    })
  }

  /** At either end the planet leans toward the missing item and springs back. */
  private bump(direction: number): void {
    if (this.motion.matches) return
    this.turnTween?.kill()
    this.turnTween = gsap.timeline({ onUpdate: this.layoutArc })
      .to(this, { position: this.index + 0.1 * direction, duration: 0.16, ease: riseEase })
      .to(this, { position: this.index, duration: 0.5, ease: 'orbit' })
  }

  /** Sets the current title behind the horizon, then raises the selected one as it reaches the sun. */
  private tell(): void {
    this.story?.kill()
    this.chartStory?.kill()
    if (!this.entered) return
    const index = this.index
    if (this.motion.matches) {
      this.fill(index)
      gsap.set(this.title, { yPercent: 0 })
      gsap.set([...this.notes, this.chart], { autoAlpha: 1, x: 0 })
      return
    }

    const story = this.story = gsap.timeline()
    const switching = this.shown >= 0
    if (switching) {
      story.to(this.title, { yPercent: BELOW_HORIZON, duration: SET_SECONDS, ease: setEase }, 0)
      story.to([...this.notes, this.chart], { autoAlpha: 0, duration: 0.2, ease: setEase }, 0)
    }
    // The new title starts rising as its marker crosses beneath the sun.
    const turning = this.turnTween?.isActive() ? this.turnTween.duration() * 0.42 : 0
    const rise = Math.max(story.duration(), turning)
    story.add(() => {
      this.fill(index)
      if (switching) this.handlers.pulse()
    }, rise)
    story.fromTo(this.title, { yPercent: BELOW_HORIZON }, { yPercent: 0, duration: RISE_SECONDS, ease: riseEase }, rise)
    // fill() rebuilds the chart, so its stars are animated only once they exist.
    story.add(() => this.drawChart(), rise + 0.2)
  }

  private drawChart(): void {
    const reveal = this.chart.querySelector<SVGPathElement>('.orbit-chart__reveal')!
    const stars = this.chart.querySelectorAll('.orbit-chart__star')
    const length = reveal.getTotalLength()
    const chart = this.chartStory = gsap.timeline()
    chart.fromTo(stars, { scale: 0, transformOrigin: '50% 50%' },
      { scale: 1, duration: 0.5, ease: 'orbit', stagger: 0.09 }, 0)
    chart.fromTo(reveal, { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: 0.95, ease: riseEase }, 0)
    this.notes.forEach((note, i) => {
      const lean = note.dataset.side === 'left' ? 6 : -6
      chart.fromTo(note, { autoAlpha: 0, x: lean }, { autoAlpha: 1, x: 0, duration: 0.6, ease: riseEase }, 0.1 + 0.09 * i)
    })
    gsap.set(this.chart, { autoAlpha: 1 })
  }

  private wheel = (event: WheelEvent): void => {
    if (!this.interactive || event.ctrlKey) return
    const now = performance.now()
    const vertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.height : 1
    const delta = (vertical ? event.deltaY : event.deltaX) * unit
    // One step per gesture: trackpad momentum keeps the wheel quiet until it fades out.
    if (now < this.wheelQuietUntil) {
      event.preventDefault()
      this.wheelQuietUntil = Math.max(this.wheelQuietUntil, now + 180)
      return
    }
    if (now - this.lastWheel > 240) this.wheelDelta = 0
    this.lastWheel = now
    // Scrolling up from the first item hands control back to the page and its descent.
    if (vertical && delta < 0 && this.index === 0) {
      this.wheelDelta = 0
      return
    }
    event.preventDefault()
    this.wheelDelta += delta
    if (Math.abs(this.wheelDelta) < WHEEL_STEP) return
    this.step(Math.sign(this.wheelDelta))
    this.wheelDelta = 0
    this.wheelQuietUntil = now + 520
  }

  private keydown = (event: KeyboardEvent): void => {
    if (!this.interactive || event.altKey || event.ctrlKey || event.metaKey) return
    if ((event.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return
    if (event.key === 'ArrowRight') this.step(1)
    else if (event.key === 'ArrowLeft') this.step(-1)
    else if (event.key === 'Home') this.select(0)
    else if (event.key === 'End') this.select(this.work.length - 1)
    else return
    event.preventDefault()
  }

  private pointerDown = (event: PointerEvent): void => {
    this.dragged = false
    if (!this.interactive || !event.isPrimary || event.button !== 0) return
    if ((event.target as Element).closest('a, .scene-button')) return
    this.drag = {
      id: event.pointerId, x: event.clientX, y: event.clientY, start: this.position,
      horizontal: null, lastPosition: this.position, lastTime: event.timeStamp, velocity: 0,
    }
  }

  private pointerMove = (event: PointerEvent): void => {
    const drag = this.drag
    if (!drag || event.pointerId !== drag.id) return
    if (drag.horizontal === null) {
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y
      if (Math.hypot(dx, dy) < 8) return
      drag.horizontal = Math.abs(dx) > Math.abs(dy)
      if (!drag.horizontal) return
      this.dragged = true
      this.turnTween?.kill()
      drag.start = drag.lastPosition = this.position
      drag.x = event.clientX
      this.space.setPointerCapture(event.pointerId)
      this.space.classList.add('is-dragging')
    }
    if (!drag.horizontal) return
    const last = this.work.length - 1
    let position = drag.start - (event.clientX - drag.x) / (this.gap * this.width / 2)
    if (position < 0) position = -rubber(-position)
    else if (position > last) position = last + rubber(position - last)
    const dt = (event.timeStamp - drag.lastTime) / 1000
    if (dt > 0) drag.velocity = 0.7 * drag.velocity + 0.3 * (position - drag.lastPosition) / dt
    drag.lastPosition = position
    drag.lastTime = event.timeStamp
    this.position = position
    this.layoutArc()
  }

  private pointerUp = (event: PointerEvent): void => {
    const drag = this.drag
    if (!drag || event.pointerId !== drag.id) return
    this.endDrag()
    if (drag.horizontal) {
      // A flick carries the planet a little further than where the finger let go; a pause does not.
      const flick = event.timeStamp - drag.lastTime < 90 ? drag.velocity * 0.16 : 0
      this.select(Math.round(this.position + Math.max(-1, Math.min(1, flick))), true)
      return
    }
    const dy = event.clientY - drag.y
    if (drag.horizontal === false && event.pointerType !== 'mouse' && Math.abs(dy) >= SWIPE) {
      this.dragged = true
      if (dy < 0) this.step(1)
      else if (this.index > 0) this.step(-1)
      else this.handlers.descend()
    }
  }

  private pointerCancel = (event: PointerEvent): void => {
    const drag = this.drag
    if (!drag || event.pointerId !== drag.id) return
    this.endDrag()
    if (drag.horizontal) this.select(Math.round(this.position), true)
  }

  private endDrag(): void {
    if (!this.drag) return
    if (this.space.hasPointerCapture(this.drag.id)) this.space.releasePointerCapture(this.drag.id)
    this.space.classList.remove('is-dragging')
    const horizontal = this.drag.horizontal
    this.drag = null
    if (horizontal && !this.interactive) this.select(Math.round(this.position), true)
  }

  private swallowClick = (event: MouseEvent): void => {
    if (!this.dragged) return
    this.dragged = false
    event.preventDefault()
    event.stopPropagation()
  }

  destroy(): void {
    this.story?.kill()
    this.chartStory?.kill()
    this.turnTween?.kill()
    this.observer.disconnect()
    this.space.removeEventListener('click', this.swallowClick, true)
    this.space.removeEventListener('pointerdown', this.pointerDown)
    this.space.removeEventListener('pointermove', this.pointerMove)
    this.space.removeEventListener('pointerup', this.pointerUp)
    this.space.removeEventListener('pointercancel', this.pointerCancel)
    window.removeEventListener('wheel', this.wheel)
    window.removeEventListener('keydown', this.keydown)
  }
}
