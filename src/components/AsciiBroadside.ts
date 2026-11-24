import { sceneScale, SEA_TILT } from './AsciiPerspective'

// A port broadside: three guns ripple bow to stern. Each discharge is a flash, a fire
// tongue, a shock ring, sparks and a bank of smoke; each ball arcs out and lands in a splash.
const RELOAD = 3
// Along the keel, matching the painted gunports; across is negative on the port side.
const GUNS = [30, -2, -34] as const
const GUN_ACROSS = -17
const GUN_HEIGHT = 10
const GUN_GAP = 0.13
const FLASH_LIFE = 0.2
const SHOCK_LIFE = 0.34
const FLIGHT = 1.28
const RANGE = 418
const ARC = 66
const SPARKS = 8
const SPARK_GRAVITY = 320
const SMOKE = 15
const SMOKE_DRAG = 2.4
const SPLASH_LIFE = 1.7
const COLUMN_LIFE = 0.85
const DROPS = 12
const DROP_GRAVITY = 300
// Recoil is a damped spring with overshoot; the hull never actually leaves its position.
const KICK_LIFE = 1.5
const INK = '#d5d5d5'
const FIRE = '#ffffff'
// Glyphs render at one reference size per weight and are scaled by transform: setting
// ctx.font re-parses the CSS string, far costlier than setTransform when sizes vary per glyph.
const FONT_PX = 10
const FONTS: Record<number, string> = {
  400: `400 ${FONT_PX}px "Geist Mono", monospace`,
  600: `600 ${FONT_PX}px "Geist Mono", monospace`,
  700: `700 ${FONT_PX}px "Geist Mono", monospace`,
}
const SIDES = [-1, 1] as const
const RING_DELAYS = [0, 0.22] as const
// From the muzzle's round core to the thinner tips of the flash.
const TONGUE = ['0', '0', '0', '1', '1', '1'] as const

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value))

/** Drops expired entries in place, so idle frames allocate nothing. */
function prune<T>(list: T[], keep: (item: T) => boolean): void {
  let kept = 0
  for (let i = 0; i < list.length; i++) {
    if (keep(list[i])) list[kept++] = list[i]
  }
  list.length = kept
}

interface Hull { x: number; y: number; heading: number; scale: number }
interface Flash { born: number; x: number; y: number; z: number; ux: number; uy: number; scale: number }
interface Particle {
  born: number; life: number; x: number; y: number; z: number
  vx: number; vy: number; vz: number; size: number; scale: number
}
interface Shot {
  born: number; x: number; y: number; z: number; dx: number; dy: number
  scale: number; landScale: number; landed: boolean
}
interface Drop { vx: number; vy: number; vz: number }
interface Splash { born: number; x: number; y: number; scale: number; height: number; drops: Drop[] }
export interface Impact { x: number; y: number; strength: number }

export class AsciiBroadside {
  /** Water pushes for the river's ripple field; drained by the river every frame. */
  readonly impacts: Impact[] = []
  private time = 0
  private lastTrigger = -Infinity
  private readonly pending: { at: number; gun: number }[] = []
  private readonly kicks: number[] = []
  private readonly flashes: Flash[] = []
  private readonly sparks: Particle[] = []
  private readonly smoke: Particle[] = []
  private readonly shots: Shot[] = []
  private readonly splashes: Splash[] = []
  private weight = 0
  // Canvas transform at the start of a draw pass; each glyph is placed relative to it.
  private ma = 1
  private mb = 0
  private mc = 0
  private md = 1
  private me = 0
  private mf = 0

  constructor(private readonly wind: number) {}

  reset(): void {
    this.lastTrigger = -Infinity
    this.pending.length = 0
    this.kicks.length = 0
    this.flashes.length = 0
    this.sparks.length = 0
    this.smoke.length = 0
    this.shots.length = 0
    this.splashes.length = 0
    this.impacts.length = 0
  }

  /** Starts a broadside if the guns are loaded; the guns fire over the next few frames. */
  trigger(): boolean {
    if (this.time - this.lastTrigger < RELOAD) return false
    this.lastTrigger = this.time
    for (let gun = 0; gun < GUNS.length; gun++) {
      this.pending.push({ at: this.time + gun * GUN_GAP, gun })
    }
    return true
  }

  /** Summed recoil spring, roughly -0.4..1; the boat turns it into a visual shove and heel. */
  kick(): number {
    let total = 0
    for (const born of this.kicks) {
      const age = this.time - born
      if (age < 0 || age >= KICK_LIFE) continue
      total += -Math.expm1(-45 * age) * Math.exp(-4.2 * age) * Math.cos(8.5 * age)
    }
    return total
  }

  update(time: number, height: number, hull: Hull): void {
    if (time < this.time) this.reset()
    this.time = time
    while (this.pending.length && this.pending[0].at <= time) {
      this.discharge(this.pending.shift()!.gun, hull, height)
    }
    for (const shot of this.shots) {
      if (shot.landed || time - shot.born < FLIGHT) continue
      shot.landed = true
      this.land(shot)
    }
    prune(this.kicks, (born) => time - born < KICK_LIFE)
    prune(this.flashes, (flash) => time - flash.born < SHOCK_LIFE)
    prune(this.sparks, (spark) => time - spark.born < spark.life)
    prune(this.smoke, (puff) => time - puff.born < puff.life)
    prune(this.shots, (shot) => !shot.landed)
    prune(this.splashes, (splash) => time - splash.born < SPLASH_LIFE)
  }

  private discharge(gun: number, hull: Hull, height: number): void {
    const time = this.time
    const fx = Math.cos(hull.heading), fy = Math.sin(hull.heading)
    const s = hull.scale
    const along = GUNS[gun]
    const x = hull.x + (along * fx - GUN_ACROSS * fy) * s
    const y = hull.y + (along * fy + GUN_ACROSS * fx) * SEA_TILT * s
    const z = GUN_HEIGHT * s
    // Outward (port) and forward ground directions, foreshortened onto the screen.
    const ox = fy, oy = -fx * SEA_TILT
    const ax = fx, ay = fy * SEA_TILT
    const length = Math.hypot(ox, oy) || 1
    this.kicks.push(time)
    this.flashes.push({ born: time, x, y, z, ux: ox / length, uy: oy / length, scale: s })

    for (let i = 0; i < SPARKS; i++) {
      const spread = (Math.random() - 0.5) * 1.1
      const speed = (140 + Math.random() * 170) * s
      this.sparks.push({
        born: time, life: 0.25 + Math.random() * 0.25, x, y, z,
        vx: (ox + ax * spread) * speed, vy: (oy + ay * spread) * speed,
        vz: (Math.random() * 90 - 10) * s, size: 1, scale: s,
      })
    }
    for (let i = 0; i < SMOKE; i++) {
      // Most smoke is blown outward with the shot; a little curls back along the hull.
      const spread = (Math.random() - 0.5) * 0.9
      const speed = (i < 3 ? 14 : 40 + Math.random() * 130) * s
      this.smoke.push({
        born: time + Math.random() * 0.06, life: 2 + Math.random() * 1.4, x, y, z,
        vx: (ox + ax * spread) * speed, vy: (oy + ay * spread) * speed,
        vz: (4 + Math.random() * 24) * s, size: 0.8 + Math.random() * 0.7, scale: s,
      })
    }

    const drift = (Math.random() - 0.5) * 0.14
    const range = RANGE * (0.88 + Math.random() * 0.26) * s
    const dx = (ox + ax * drift) * range, dy = (oy + ay * drift) * range
    this.shots.push({
      born: time, x, y, z, dx, dy, scale: s,
      landScale: sceneScale(y + dy, height) * (s / Math.max(0.01, sceneScale(hull.y, height))),
      landed: false,
    })
    // The muzzle blast flattens the water right under the port.
    this.impacts.push({ x: x + ox * 8 * s, y: y + oy * 8 * s, strength: 0.45 })
  }

  private land(shot: Shot): void {
    const x = shot.x + shot.dx, y = shot.y + shot.dy, s = shot.landScale
    const drops: Drop[] = []
    for (let i = 0; i < DROPS; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (12 + Math.random() * 46) * s
      drops.push({
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * SEA_TILT,
        vz: (70 + Math.random() * 90) * s,
      })
    }
    this.splashes.push({ born: this.time, x, y, scale: s, height: 0.8 + Math.random() * 0.4, drops })
    this.impacts.push({ x, y, strength: 1 })
  }

  private begin(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const m = ctx.getTransform()
    this.ma = m.a; this.mb = m.b; this.mc = m.c; this.md = m.d; this.me = m.e; this.mf = m.f
    this.weight = 0
  }

  private put(
    ctx: CanvasRenderingContext2D, glyph: '0' | '1', x: number, y: number,
    alpha: number, size: number, weight = 400,
  ): void {
    if (alpha <= 0.004) return
    if (weight !== this.weight) {
      ctx.font = FONTS[weight]
      this.weight = weight
    }
    const k = Math.max(3, size) / FONT_PX
    const { ma, mb, mc, md } = this
    ctx.setTransform(ma * k, mb * k, mc * k, md * k, ma * x + mc * y + this.me, mb * x + md * y + this.mf)
    ctx.globalAlpha = Math.min(1, alpha)
    ctx.fillText(glyph, 0, 0)
  }

  private get idle(): boolean {
    return !this.flashes.length && !this.sparks.length && !this.smoke.length
      && !this.shots.length && !this.splashes.length
  }

  /** Effects behind the hull draw before it (`front` false); the rest after, so the hull occludes correctly. */
  draw(ctx: CanvasRenderingContext2D, hullY: number, front: boolean, opacity: number): void {
    if (this.idle) return
    const time = this.time
    this.begin(ctx)

    ctx.fillStyle = INK
    for (const splash of this.splashes) {
      if ((splash.y >= hullY) === front) this.drawSplash(ctx, splash, time - splash.born, opacity)
    }
    for (const shot of this.shots) {
      if ((shot.y + shot.dy * 0.5 >= hullY) === front) this.drawShot(ctx, shot, time - shot.born, opacity)
    }
    for (const puff of this.smoke) {
      if ((puff.y >= hullY) === front) this.drawPuff(ctx, puff, time - puff.born, opacity)
    }
    ctx.fillStyle = FIRE
    for (const spark of this.sparks) {
      if ((spark.y >= hullY) !== front) continue
      const age = time - spark.born
      const z = spark.z + spark.vz * age - 0.5 * SPARK_GRAVITY * spark.scale * age * age
      if (z < 0) continue
      const fade = 1 - age / spark.life
      this.put(
        ctx, spark.vz - SPARK_GRAVITY * spark.scale * age > 0 ? '0' : '1',
        spark.x + spark.vx * age, spark.y + spark.vy * age - z,
        fade * fade * opacity, 8 * spark.scale, 600,
      )
    }
    for (const flash of this.flashes) {
      if ((flash.y >= hullY) === front) this.drawFlash(ctx, flash, time - flash.born, opacity)
    }
    ctx.restore()
  }

  private drawFlash(ctx: CanvasRenderingContext2D, flash: Flash, age: number, opacity: number): void {
    const s = flash.scale
    const x = flash.x, y = flash.y - flash.z
    const { ux, uy } = flash
    if (age < FLASH_LIFE) {
      const k = age / FLASH_LIFE
      const fade = (1 - k) ** 1.4
      // A white bloom for the first frames, then a dense core.
      if (age < 0.07) this.put(ctx, '0', x + ux * 6 * s, y + uy * 6 * s, 0.4 * opacity, 36 * s, 700)
      this.put(ctx, k < 0.35 ? '0' : '1', x, y, fade * opacity, 15 * s, 700)
      // The fire tongue lunges out, then retracts while thinning to sparks.
      const reach = (16 + 46 * Math.sin(Math.min(1, age / 0.06) * Math.PI / 2)) * s * (1 - k * 0.55)
      const count = TONGUE.length
      for (let j = 1; j < count; j++) {
        const t = j / (count - 1)
        const wobble = Math.sin(age * 90 + j * 2.1) * 1.4 * s * t
        this.put(
          ctx, TONGUE[j],
          x + ux * reach * t - uy * wobble, y + uy * reach * t + ux * wobble,
          fade * (1 - t * 0.55) * opacity, (15 - t * 5) * s, 700,
        )
      }
      // Side flare at the muzzle lip.
      const flare = (4 + age * 40) * s
      for (const sign of SIDES) {
        this.put(
          ctx, '1', x + ux * 3 * s - uy * flare * sign, y + uy * 3 * s + ux * flare * sign,
          fade * 0.6 * opacity, 8 * s, 600,
        )
      }
    }
    // The pressure wave: a ring of dots racing out from the muzzle.
    if (age < SHOCK_LIFE) {
      const k = age / SHOCK_LIFE
      const radius = (5 + 80 * Math.sqrt(age)) * s
      const cx = x + ux * radius * 0.45, cy = y + uy * radius * 0.45
      const points = 14
      for (let p = 0; p < points; p++) {
        const angle = p / points * Math.PI * 2
        this.put(
          ctx, '1', cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.7,
          0.4 * (1 - k) ** 2 * opacity, 8 * s,
        )
      }
    }
  }

  private drawPuff(ctx: CanvasRenderingContext2D, puff: Particle, age: number, opacity: number): void {
    if (age < 0) return
    const f = age / puff.life
    const s = puff.scale
    const glide = -Math.expm1(-SMOKE_DRAG * age) / SMOKE_DRAG
    const drift = 14 * s * age
    const x = puff.x + puff.vx * glide + Math.cos(this.wind) * drift
    const y = puff.y + puff.vy * glide + Math.sin(this.wind) * SEA_TILT * drift
    const z = puff.z + puff.vz * glide + 10 * s * age
    const glyph = f < 0.62 ? '0' : '1'
    // Lit by the flash at birth, then dulling to grey as it billows and thins.
    const lit = 1 + 1.3 * Math.exp(-age * 9)
    const swell = f < 0.06 ? f / 0.06 : 1
    this.put(
      ctx, glyph, x, y - z,
      swell * 0.62 * lit * (1 - f) ** 1.3 * opacity, (9 + 16 * f) * puff.size * s,
    )
  }

  private drawShot(ctx: CanvasRenderingContext2D, shot: Shot, age: number, opacity: number): void {
    const u = clamp(age / FLIGHT)
    const growth = shot.landScale - shot.scale
    const scale = shot.scale + growth * u
    const x = shot.x + shot.dx * u, y = shot.y + shot.dy * u
    const z = shot.z * (1 - u) + ARC * scale * 4 * u * (1 - u)
    // Shadow on the water, then a fading trail of hot air behind the ball.
    this.put(ctx, '1', x, y, 0.2 * opacity, 8 * scale)
    for (let j = 1; j <= 4; j++) {
      const v = u - j * 0.035
      if (v < 0) break
      const tz = shot.z * (1 - v) + ARC * (shot.scale + growth * v) * 4 * v * (1 - v)
      this.put(
        ctx, '1', shot.x + shot.dx * v, shot.y + shot.dy * v - tz,
        0.55 * (1 - j / 5) * opacity, 8 * scale,
      )
    }
    this.put(ctx, '0', x, y - z, 0.95 * opacity, 10 * scale, 700)
  }

  private drawSplash(ctx: CanvasRenderingContext2D, splash: Splash, age: number, opacity: number): void {
    const s = splash.scale
    const { x, y } = splash
    // Expanding rings on the water, foreshortened onto the sea plane.
    for (const delay of RING_DELAYS) {
      const t = age - delay
      if (t < 0 || t >= 1.4) continue
      const radius = (5 + 44 * Math.sqrt(t)) * s
      const points = 16
      const fade = 0.45 * (1 - t / 1.4) ** 2 * (delay ? 0.7 : 1)
      for (let p = 0; p < points; p++) {
        const angle = (p + delay * 10) / points * Math.PI * 2
        this.put(
          ctx, t < 0.45 ? '0' : '1', x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius * SEA_TILT, fade * opacity, 9 * s,
        )
      }
    }
    // Foam churned at the point of impact.
    this.put(
      ctx, age < 1 ? '0' : '1', x, y,
      0.65 * (1 - age / SPLASH_LIFE) * opacity, 9 * s,
    )
    // The column shoots up, overshoots and collapses back with a widening crown.
    if (age < COLUMN_LIFE) {
      const k = age / COLUMN_LIFE
      const rise = k < 0.28 ? Math.sin(k / 0.28 * Math.PI / 2) : Math.cos((k - 0.28) / 0.72 * Math.PI / 2)
      const top = 36 * splash.height * s * rise
      const fade = 0.85 * (1 - k) ** 0.7 * opacity
      for (let h = 0; h < top; h += 5 * s) {
        this.put(ctx, '1', x, y - h, fade * (0.45 + 0.55 * h / Math.max(1, top)), 9 * s)
      }
      this.put(ctx, k < 0.28 ? '0' : '1', x, y - top, fade, 9 * s, 600)
      const crown = (3 + 16 * k) * s
      const lift = 7 * s * (1 - k)
      this.put(ctx, '1', x - crown, y - lift, fade * 0.85, 9 * s)
      this.put(ctx, '1', x + crown, y - lift, fade * 0.85, 9 * s)
      this.put(ctx, '0', x - crown * 0.5, y - lift * 1.6, fade * 0.6, 9 * s)
      this.put(ctx, '0', x + crown * 0.5, y - lift * 1.6, fade * 0.6, 9 * s)
    }
    // Droplets arc out and fall back.
    const gravity = DROP_GRAVITY * s
    for (const drop of splash.drops) {
      const z = drop.vz * age - 0.5 * gravity * age * age
      if (z < 0) continue
      this.put(
        ctx, drop.vz - gravity * age > 0 ? '0' : '1',
        x + drop.vx * age, y + drop.vy * age - z, 0.7 * (1 - age / 1.2) * opacity, 8 * s,
      )
    }
  }

  /** A binary gauge under the hull while the guns reload; it pulses once when ready. */
  drawReload(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, opacity: number): void {
    const since = this.time - this.lastTrigger
    if (!(since >= 0) || since > RELOAD + 0.8) return
    const progress = clamp(since / RELOAD)
    const done = since - RELOAD
    const fadeIn = clamp(since / 0.25)
    const fadeOut = done > 0 ? 1 - clamp((done - 0.15) / 0.65) : 1
    const pulse = done > 0 ? Math.exp(-done * 7) : 0
    const cells = 12
    const step = 4 * scale
    this.begin(ctx)
    ctx.fillStyle = INK
    const base = opacity * fadeIn * fadeOut
    for (let i = 0; i < cells; i++) {
      const fill = clamp(progress * cells - i)
      this.put(
        ctx, fill >= 1 ? '1' : '0', x + (i - (cells - 1) / 2) * step, y,
        base * (0.14 + 0.3 * fill + 0.4 * pulse), 8 * scale,
      )
    }
    ctx.restore()
  }
}
