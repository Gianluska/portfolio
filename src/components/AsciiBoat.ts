import { AsciiBroadside } from './AsciiBroadside'
import { HORIZON, sceneScale, seaDepth, SEA_TILT } from './AsciiPerspective'

// An upright, full-rigged ship above a turning, foreshortened waterline.
const FADE_IN = 0.8
const MAX_SPEED = 230
const THRUST = 380
const BRAKE = 240
// The keel kills sideways drift quickly, so turns carve instead of sliding.
const KEEL = 5.5
const TURN_RATE = 2.8
const TURN_RESPONSE = 6
// Stops short of the cursor instead of circling under it; the bowsprit ends near the cursor.
const ARRIVE = 90
const SLOW_RADIUS = 210
// Reference-plane bounds include the bowsprit and the masthead's fluttering pennant.
const EDGE = 88
const WATER_EDGE = 38
// Foam: two arms spread from the transom while the ship is under way.
const FOAM_POINTS = 48
const FOAM_LIFE = 1.4
const FOAM_GAP = 7
const STERN = 46
const MASTS = [
  { along: -31, across: 4, height: 74, half: 15 },
  { along: 0, across: 0, height: 94, half: 22 },
  { along: 31, across: -4, height: 82, half: 18 },
] as const
// Four rows of cloth; the yard is rigid, the body and hem breathe below it.
const SAIL = [
  '.--+--.',
  '| :|: |',
  '( .|. )',
  ' \\_|_/ ',
] as const
// Idle life. The prevailing wind blows toward screen east, a little south; the
// pennant streams with it at rest and swings aft as the ship gathers way.
// Offset the scene's extra 20% gain so the ship keeps its approved brightness.
const INK = '#d5d5d5'
const WIND = 0.15
const BILLOW = 3
const PENNANT = 7
const PENNANT_STEP = 4.5
const PENNANT_RESPONSE = 4
// Wavelets lap at the hull while the ship lies still.
const LAP_PERIOD = 2.6
// Broadside recoil: a visual shove to starboard and a heel of the rig, never real motion.
const KICK = 3.2
const HEEL = 0.06

const wrapAngle = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle))
const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value))

/** Steering state on the shared clock; the river turns its motion into the wake. */
export class AsciiBoat {
  x = 0
  y = 0
  heading = 0
  speed = 0
  active = false
  private vx = 0
  private vy = 0
  private turn = 0
  private pennantAngle = WIND
  private alpha = 0
  private time = 0
  private born = 0
  private spawned = false
  private rigLight = 0
  private steered = false
  private lastTime = Number.NaN
  private travelled = 0
  private scale = 1
  private projectionX = 1
  private projectionY = 0
  private foamHead = 0
  private readonly foamX = new Float32Array(FOAM_POINTS)
  private readonly foamY = new Float32Array(FOAM_POINTS)
  private readonly foamSideX = new Float32Array(FOAM_POINTS)
  private readonly foamSideY = new Float32Array(FOAM_POINTS)
  private readonly foamBirth = new Float32Array(FOAM_POINTS).fill(-Infinity)
  private readonly foamStrength = new Float32Array(FOAM_POINTS)
  private readonly foamScale = new Float32Array(FOAM_POINTS)
  private readonly broadside = new AsciiBroadside(WIND)

  /** Water pushes from muzzle blasts and shot splashes, drained by the river. */
  get impacts(): AsciiBroadside['impacts'] {
    return this.broadside.impacts
  }

  /** Fires the port broadside if the guns are loaded. */
  fire(): boolean {
    if (!this.active || this.alpha < 0.9) return false
    return this.broadside.trigger()
  }

  /** 0..1 share of top speed, used by the river to scale the hull's push on the water. */
  get wake(): number {
    return this.active ? clamp(this.speed / MAX_SPEED) : 0
  }

  /** Seconds since the reveal reached the horizon; reduced motion holds the idle pose. */
  update(
    time: number, width: number, height: number, enabled: boolean,
    pointerX = Number.NaN, pointerY = Number.NaN,
  ): void {
    if (time < 0) {
      this.active = false
      this.spawned = false
      this.lastTime = time
      return
    }
    if (time < this.lastTime || !enabled) this.spawned = false
    const dt = enabled && time > this.lastTime ? Math.min(0.05, time - this.lastTime) : 0
    this.lastTime = time
    this.time = time
    const fit = Math.min(1.7, width / 380, height / 300)
    const top = height * HORIZON + 2 * fit
    if (!this.spawned) this.spawn(time)
    if (!this.steered) {
      this.x = width / 2
      this.y = top
    }
    this.scale = sceneScale(this.y, height) * fit
    this.active = true
    const fade = clamp((time - this.born) / FADE_IN)
    this.alpha = enabled ? fade * fade * (3 - 2 * fade) : 1

    let targetX = Number.NaN, targetY = Number.NaN
    if (enabled && Number.isFinite(pointerX) && Number.isFinite(pointerY)) {
      targetX = pointerX
      targetY = pointerY
      this.steered = true
    }

    let desiredSpeed = 0, desiredTurn = 0
    if (Number.isFinite(targetX)) {
      const dx = (targetX - this.x) / this.scale
      const dy = (targetY - this.y) / (this.scale * SEA_TILT)
      const distance = Math.hypot(dx, dy)
      const error = wrapAngle(Math.atan2(dy, dx) - this.heading)
      // Ease off while the bow points away, so a target behind makes a tight turn.
      const facing = (1 + Math.cos(error)) / 2
      desiredSpeed = MAX_SPEED * clamp((distance - ARRIVE) / SLOW_RADIUS) * Math.max(0.22, facing)
      if (distance > ARRIVE * 0.7) {
        const forward = this.vx * Math.cos(this.heading) + this.vy * Math.sin(this.heading)
        // Rudders need water flowing past them; a near-stopped boat turns slowly.
        const authority = 0.35 + 0.65 * clamp(Math.abs(forward) / 110)
        desiredTurn = clamp(error * 3, -TURN_RATE, TURN_RATE) * authority
      }
    }

    this.turn += (desiredTurn - this.turn) * (1 - Math.exp(-TURN_RESPONSE * dt))
    this.heading = wrapAngle(this.heading + this.turn * dt)
    const fx = Math.cos(this.heading), fy = Math.sin(this.heading)
    let forward = this.vx * fx + this.vy * fy
    let lateral = this.vy * fx - this.vx * fy
    forward += forward < desiredSpeed
      ? Math.min(THRUST * dt, desiredSpeed - forward)
      : Math.max(-BRAKE * dt, desiredSpeed - forward)
    lateral *= Math.exp(-KEEL * dt)
    this.vx = fx * forward - fy * lateral
    this.vy = fy * forward + fx * lateral
    this.x += this.vx * dt * this.scale
    this.y += this.vy * dt * this.scale * SEA_TILT
    this.scale = sceneScale(this.y, height) * fit
    this.speed = Math.hypot(this.vx, this.vy)

    // Blend angles, not opposing vectors: wind and aft must not cancel into a flip.
    const under = clamp(this.speed / MAX_SPEED) * 0.75
    const target = WIND + wrapAngle(this.heading + Math.PI - WIND) * under
    this.pennantAngle = wrapAngle(
      this.pennantAngle + wrapAngle(target - this.pennantAngle) * -Math.expm1(-PENNANT_RESPONSE * dt),
    )

    const edge = EDGE * this.scale
    const bottom = Math.max(top, height - WATER_EDGE * this.scale)
    this.x = clamp(this.x, edge, Math.max(edge, width - edge))
    this.y = clamp(this.y, top, bottom)
    this.scale = sceneScale(this.y, height) * fit
    this.rigLight = clamp((seaDepth(this.y, height) - 0.06) / 0.4)

    this.travelled += this.speed * dt
    if (this.travelled >= FOAM_GAP) {
      this.travelled = 0
      if (this.speed > 30) {
        const slot = this.foamHead
        this.foamHead = (slot + 1) % FOAM_POINTS
        this.foamX[slot] = this.x - fx * STERN * this.scale
        this.foamY[slot] = this.y - fy * STERN * this.scale * SEA_TILT
        this.foamSideX[slot] = -fy
        this.foamSideY[slot] = fx * SEA_TILT
        this.foamScale[slot] = this.scale
        this.foamBirth[slot] = time
        this.foamStrength[slot] = clamp(this.speed / MAX_SPEED)
      }
    }
    this.broadside.update(time, height, { x: this.x, y: this.y, heading: this.heading, scale: this.scale })
  }

  private spawn(time: number): void {
    this.spawned = true
    this.steered = false
    this.born = time
    this.heading = 0
    this.turn = 0
    this.pennantAngle = WIND
    this.vx = 0
    this.vy = 0
    this.speed = 0
    this.travelled = 0
    this.foamBirth.fill(-Infinity)
    this.broadside.reset()
  }

  /** ASCII strokes are sampled in screen space, so no contour becomes a solid line. */
  private stroke(
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number, x1: number, y1: number, glyph = '',
  ): void {
    const dx = x1 - x0, dy = y1 - y0
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 5.5))
    const mark = glyph || (Math.abs(dy) < Math.abs(dx) * 0.42
      ? '-' : Math.abs(dx) < Math.abs(dy) * 0.32 ? '|' : dx * dy > 0 ? '\\' : '/')
    for (let step = 0; step <= count; step++) {
      const along = step / count
      ctx.fillText(mark, x0 + dx * along, y0 + dy * along)
    }
  }

  /** Rotation affects only the ground plane; elevation always points up the screen. */
  private groundStroke(
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number, z0: number,
    x1: number, y1: number, z1: number, glyph = '',
  ): void {
    const fx = this.projectionX, fy = this.projectionY
    this.stroke(
      ctx, x0 * fx - y0 * fy, (x0 * fy + y0 * fx) * SEA_TILT - z0,
      x1 * fx - y1 * fy, (x1 * fy + y1 * fx) * SEA_TILT - z1, glyph,
    )
  }

  private maskPoint(
    ctx: CanvasRenderingContext2D, along: number, across: number, elevation: number,
    first = false,
  ): void {
    const x = along * this.projectionX - across * this.projectionY
    const y = (along * this.projectionY + across * this.projectionX) * SEA_TILT - elevation
    if (first) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }

  private drawMast(ctx: CanvasRenderingContext2D, index: number, opacity: number): void {
    const mast = MASTS[index]
    const x = mast.along * this.projectionX - mast.across * this.projectionY
    const deckY = (mast.along * this.projectionY + mast.across * this.projectionX) * SEA_TILT
    ctx.font = '400 9px "Geist Mono", monospace'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3.5
    ctx.globalAlpha = this.alpha
    ctx.beginPath()
    ctx.moveTo(x, deckY - 16)
    ctx.lineTo(x, deckY - mast.height - 3)
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.globalAlpha = opacity * 0.86 * this.rigLight
    this.stroke(ctx, x, deckY - 16, x, deckY - mast.height, '|')
    ctx.fillText('+', x, deckY - mast.height)

    for (let tier = 0; tier < 2; tier++) {
      // Yards keep a readable width even when the keel points directly at the viewer.
      const half = Math.max(15, mast.half * (tier === 0 ? 0.76 : 1))
        * (0.9 + Math.abs(this.projectionY) * 0.1)
      const top = deckY - mast.height + (tier === 0 ? 12 : 42)
      const belly = BILLOW * (0.55 + 0.25 * Math.sin(this.time * 0.9)
        + 0.2 * Math.sin(this.time * 1.6 + index * 0.9 + tier))
      // A solid sail reads against bright horizon haze; seams emerge in the foreground.
      ctx.fillStyle = '#000'
      ctx.globalAlpha = this.alpha
      ctx.beginPath()
      ctx.moveTo(x - half, top - 3)
      ctx.lineTo(x + half, top - 3)
      ctx.lineTo(x + half, top + 12)
      ctx.quadraticCurveTo(x, top + 25 + belly, x - half, top + 12)
      ctx.closePath()
      ctx.fill()
      if (this.rigLight === 0) continue
      ctx.fillStyle = INK
      ctx.font = '400 8px "Geist Mono", monospace'
      for (let row = 0; row < SAIL.length; row++) {
        const cloth = SAIL[row]
        for (let col = 0; col < cloth.length; col++) {
          const glyph = cloth[col]
          if (glyph === ' ') continue
          const across = (col - 3) / 3
          const bow = Math.max(0, 1 - across * across)
          const edge = row === 0 || row === 3 || col === 0 || col === 6 || col === 3
          ctx.globalAlpha = opacity * this.rigLight * (edge ? 0.91 : 0.35)
          ctx.fillText(
            glyph, x + across * half,
            top + row * 6 + (row === 0 ? 0 : belly * bow * row / 3),
          )
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.alpha <= 0) return
    this.broadside.draw(ctx, this.y, false, this.alpha)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = INK

    // Each stamp keeps the scale and ground-plane direction at the time it was shed.
    ctx.font = '400 9px "Geist Mono", monospace'
    for (let slot = 0; slot < FOAM_POINTS; slot++) {
      const age = this.time - this.foamBirth[slot]
      if (!(age >= 0 && age < FOAM_LIFE)) continue
      const life = 1 - age / FOAM_LIFE
      const strength = this.foamStrength[slot]
      const spread = 8 + age * 26 * strength
      const alpha = life * life * (0.18 + strength * 0.4) * this.alpha
      const sideX = this.foamSideX[slot] * spread
      const sideY = this.foamSideY[slot] * spread
      ctx.save()
      ctx.translate(this.foamX[slot], this.foamY[slot])
      ctx.scale(this.foamScale[slot], this.foamScale[slot])
      ctx.globalAlpha = alpha
      ctx.fillText(age < 0.35 ? ':' : '.', sideX, sideY)
      ctx.fillText(age < 0.35 ? ':' : '.', -sideX, -sideY)
      if (age < 0.5) {
        ctx.globalAlpha = alpha * 0.8
        ctx.fillText(age < 0.2 ? '*' : '~', 0, 0)
      }
      ctx.restore()
    }

    const calm = 1 - clamp(this.speed / MAX_SPEED)
    const rock = Math.sin(this.time * 1.7) * 0.018 * calm
    this.projectionX = Math.cos(this.heading + rock)
    this.projectionY = Math.sin(this.heading + rock)
    const fx = this.projectionX, fy = this.projectionY
    const kick = this.broadside.kick()
    const opacity = this.alpha * (0.65 + 0.35 * Math.min(1, this.scale / 1.1))
    ctx.translate(
      this.x - fy * KICK * kick * this.scale,
      this.y + Math.sin(this.time * 1.3) * 0.65 * calm * this.scale + fx * SEA_TILT * KICK * kick * this.scale,
    )
    ctx.scale(this.scale, this.scale)
    // Shear the rig away from the guns: mastheads lean to starboard, then swing back.
    ctx.transform(1, 0, fy * HEEL * kick, 1, 0, 0)
    ctx.font = '400 9px "Geist Mono", monospace'

    // Raised stern, broad deck and tapered bow: the black silhouette only hides water.
    ctx.fillStyle = '#000000'
    ctx.globalAlpha = this.alpha * 0.96
    ctx.beginPath()
    this.maskPoint(ctx, -53, -12, 22, true)
    this.maskPoint(ctx, -38, -17, 15)
    this.maskPoint(ctx, 36, -14, 15)
    this.maskPoint(ctx, 57, 0, 18)
    this.maskPoint(ctx, 36, 14, 15)
    this.maskPoint(ctx, -38, 17, 15)
    this.maskPoint(ctx, -53, 12, 22)
    ctx.closePath()
    ctx.fill()

    // Forestays, shrouds and the long bowsprit are character strokes, not Canvas lines.
    ctx.fillStyle = this.rigLight > 0.5 ? INK : '#000'
    ctx.globalAlpha = opacity * 0.64
    ctx.strokeStyle = ctx.fillStyle
    ctx.lineWidth = 2.7
    ctx.beginPath()
    this.maskPoint(ctx, 36, 0, 16, true)
    this.maskPoint(ctx, 82, 0, 27)
    this.maskPoint(ctx, MASTS[2].along, MASTS[2].across, MASTS[2].height - 24)
    ctx.stroke()
    for (let index = 0; index < MASTS.length; index++) {
      const mast = MASTS[index]
      this.groundStroke(ctx, mast.along, mast.across, mast.height - 3, -49, 0, 20, '.')
      this.groundStroke(ctx, mast.along, mast.across, mast.height - 3, 75, 0, 24, '.')
      this.groundStroke(ctx, mast.along, mast.across, mast.height - 28, mast.along - 12, -15, 15, ':')
      this.groundStroke(ctx, mast.along, mast.across, mast.height - 28, mast.along - 12, 15, 15, ':')
    }
    ctx.fillStyle = INK
    ctx.globalAlpha = opacity * 0.92
    this.groundStroke(ctx, -53, -12, 22, -38, -17, 15)
    this.groundStroke(ctx, -38, -17, 15, 36, -14, 15)
    this.groundStroke(ctx, 36, -14, 15, 57, 0, 18)
    this.groundStroke(ctx, 57, 0, 18, 36, 14, 15)
    this.groundStroke(ctx, 36, 14, 15, -38, 17, 15)
    this.groundStroke(ctx, -38, 17, 15, -53, 12, 22)
    this.groundStroke(ctx, -53, 12, 22, -53, -12, 22)
    // Hatch and sterncastle windows remain attached to the turning deck.
    ctx.globalAlpha = opacity * 0.55
    this.groundStroke(ctx, -45, -8, 23, -35, -8, 23, '=')
    this.groundStroke(ctx, -45, 8, 23, -35, 8, 23, '=')
    this.groundStroke(ctx, -15, 0, 16, 18, 0, 16, ':')

    // Paint the far mast first; the nearer canvas naturally occludes its rigging.
    for (let layer = 0; layer < MASTS.length; layer++) {
      this.drawMast(ctx, fy >= 0 ? layer : MASTS.length - 1 - layer, opacity)
    }

    // The near planked hull covers the mast feet, with gunports and a high transom.
    const near = fx >= 0 ? 1 : -1
    ctx.font = '400 9px "Geist Mono", monospace'
    ctx.fillStyle = '#000000'
    ctx.globalAlpha = this.alpha * 0.96
    ctx.beginPath()
    this.maskPoint(ctx, -53, near * 12, 22, true)
    this.maskPoint(ctx, -38, near * 17, 15)
    this.maskPoint(ctx, 36, near * 14, 15)
    this.maskPoint(ctx, 57, 0, 18)
    this.maskPoint(ctx, 39, near * 9, 0)
    this.maskPoint(ctx, -47, near * 11, 0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = INK
    ctx.globalAlpha = opacity * 0.94
    this.groundStroke(ctx, -53, near * 12, 22, -38, near * 17, 15)
    this.groundStroke(ctx, -38, near * 17, 15, 36, near * 14, 15)
    this.groundStroke(ctx, 36, near * 14, 15, 57, 0, 18)
    this.groundStroke(ctx, 57, 0, 18, 39, near * 9, 0)
    this.groundStroke(ctx, 39, near * 9, 0, -47, near * 11, 0, '_')
    this.groundStroke(ctx, -47, near * 11, 0, -53, near * 12, 22)
    ctx.globalAlpha = opacity * 0.5
    this.groundStroke(ctx, -44, near * 13, 5, 39, near * 11, 5, '=')
    for (let along = -34; along <= 30; along += 16) {
      ctx.fillText('o', along * fx - near * 15 * fy, (along * fy + near * 15 * fx) * SEA_TILT - 10)
    }
    this.groundStroke(ctx, -52, -8, 17, -52, 8, 17, '#')
    this.groundStroke(ctx, -52, 0, 0, -58, 0, -3, '|')

    // End-on headings expose a full transom or both cheeks of the pointed bow.
    if (fy < 0) {
      ctx.fillStyle = '#000000'
      ctx.globalAlpha = this.alpha * 0.96
      ctx.beginPath()
      this.maskPoint(ctx, -53, -12, 22, true)
      this.maskPoint(ctx, -53, 12, 22)
      this.maskPoint(ctx, -47, 11, 0)
      this.maskPoint(ctx, -47, -11, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = INK
      ctx.globalAlpha = opacity * 0.85
      this.groundStroke(ctx, -53, -12, 22, -53, 12, 22)
      this.groundStroke(ctx, -53, -12, 22, -47, -11, 0)
      this.groundStroke(ctx, -53, 12, 22, -47, 11, 0)
      this.groundStroke(ctx, -47, -11, 0, -47, 11, 0, '_')
      ctx.globalAlpha = opacity * 0.55
      this.groundStroke(ctx, -51, -8, 13, -51, 8, 13, '#')
    } else {
      ctx.fillStyle = '#000000'
      ctx.globalAlpha = this.alpha * 0.96
      ctx.beginPath()
      this.maskPoint(ctx, 36, -14, 15, true)
      this.maskPoint(ctx, 57, 0, 18)
      this.maskPoint(ctx, 36, 14, 15)
      this.maskPoint(ctx, 39, 9, 0)
      this.maskPoint(ctx, 39, -9, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = INK
      ctx.globalAlpha = opacity * 0.85
      this.groundStroke(ctx, 36, -14, 15, 57, 0, 18)
      this.groundStroke(ctx, 36, 14, 15, 57, 0, 18)
      this.groundStroke(ctx, 57, 0, 18, 39, -9, 0)
      this.groundStroke(ctx, 57, 0, 18, 39, 9, 0)
      this.groundStroke(ctx, 39, -9, 0, 39, 9, 0, '_')
    }

    // A screen-space ribbon eases continuously between wind and the projected stern.
    const flagX = 0, flagY = -MASTS[1].height
    const flowX = Math.cos(this.pennantAngle)
    const flowY = Math.sin(this.pennantAngle) * SEA_TILT
    ctx.font = '600 9px "Geist Mono", monospace'
    ctx.fillStyle = this.rigLight > 0.5 ? INK : '#000'
    for (let step = 1; step <= PENNANT; step++) {
      const wave = Math.sin(this.time * 7 - step * 1.1) * step * 0.45
      const x = flagX + flowX * step * PENNANT_STEP - flowY * wave
      const y = flagY + flowY * step * PENNANT_STEP + flowX * wave
      const width = 2.5 * (1 - step / PENNANT)
      ctx.globalAlpha = opacity * (1 - step * 0.025)
      ctx.fillText('~', x, y - width)
      if (step < PENNANT - 1) ctx.fillText('~', x, y + width)
    }

    ctx.fillStyle = INK
    // Lapping foam is projected around the waterline, never around the tall sails.
    if (calm > 0.4) {
      const lap = (this.time / LAP_PERIOD) % 1
      const fade = (calm - 0.4) / 0.6 * Math.sin(lap * Math.PI)
      const across = 21 + lap * 9
      ctx.font = '400 9px "Geist Mono", monospace'
      ctx.globalAlpha = 0.35 * fade * opacity
      for (let side = -1; side <= 1; side += 2) {
        for (let along = -27; along <= 27; along += 27) {
          ctx.fillText(
            '~', along * fx - side * across * fy,
            (along * fy + side * across * fx) * SEA_TILT + 1,
          )
        }
      }
    }
    ctx.restore()
    this.broadside.draw(ctx, this.y, true, this.alpha)
    // The reload gauge sits just below whatever end of the hull faces the viewer.
    const below = (Math.max(82 * fy, -58 * fy, 0) + 26 * Math.abs(fx)) * SEA_TILT + 12
    this.broadside.drawReload(ctx, this.x, this.y + below * this.scale, this.scale, this.alpha)
  }
}
