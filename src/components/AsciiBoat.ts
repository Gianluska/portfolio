// A top-down old sailing ship enters when the reveal wave reaches the bottom and steers toward the pointer.
const BOAT_ENTER = 0
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
// Keeps the whole ship, bowsprit to rudder, on screen once it has sailed in.
const EDGE = 64
// Foam: two arms spread from the transom while the ship is under way.
const FOAM_POINTS = 48
const FOAM_LIFE = 1.4
const FOAM_GAP = 7
const STERN = 58
const LINE = 8.5
const CHAR = 6
// Authored bow up, 15 columns: bowsprit and forestay, pointed bow, three masts (`o`)
// whose yards carry bellied square sails wider than the hull, stern castle and rudder.
const HULL = [
  '       |       ',
  '      /|\\      ',
  '     / | \\     ',
  '    /  |  \\    ',
  '  .----o----.  ',
  '  \\_________/  ',
  '    |  .  |    ',
  ' .-----o-----. ',
  ' \\___________/ ',
  '    |  .  |    ',
  '   .---o---.   ',
  '   \\_______/   ',
  '    |[___]|    ',
  '    \\_____/    ',
  '       |       ',
] as const
const MIDDLE = (HULL.length - 1) / 2
// Each sail spans its yard row and the bellied row below it; half-width in characters.
const SAILS = [
  { row: 4, half: 5.5 },
  { row: 7, half: 6.5 },
  { row: 10, half: 4.5 },
] as const
// Idle life. The prevailing wind blows toward screen east, a little south; the
// pennant streams with it at rest and swings aft as the ship gathers way.
const WIND = 0.15
const BILLOW = 5
const PENNANT = 9
const PENNANT_STEP = 6.5
const PENNANT_RESPONSE = 4
// Wavelets lap at the hull while the ship lies still.
const LAP_PERIOD = 2.6

const wrapAngle = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle))
const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value))

/** Steering state on the shared clock; the river turns its motion into the wake. */
export class AsciiBoat {
  x = 0
  y = 0
  heading = -Math.PI / 2
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
  private inside = false
  private steered = false
  private lastTime = Number.NaN
  private travelled = 0
  private foamHead = 0
  private readonly foamX = new Float32Array(FOAM_POINTS)
  private readonly foamY = new Float32Array(FOAM_POINTS)
  private readonly foamSideX = new Float32Array(FOAM_POINTS)
  private readonly foamSideY = new Float32Array(FOAM_POINTS)
  private readonly foamBirth = new Float32Array(FOAM_POINTS).fill(-Infinity)
  private readonly foamStrength = new Float32Array(FOAM_POINTS)
  private readonly billow = new Float32Array(SAILS.length)

  /** 0..1 share of top speed, used by the river to scale the hull's push on the water. */
  get wake(): number {
    return this.active ? clamp(this.speed / MAX_SPEED) : 0
  }

  /** Seconds since the reveal wave reached the bottom; pointer is NaN when absent. */
  update(
    time: number, width: number, height: number, enabled: boolean,
    pointerX = Number.NaN, pointerY = Number.NaN,
  ): void {
    if (!enabled || time < BOAT_ENTER || width <= 0 || height <= 0) {
      this.active = false
      this.spawned = false
      this.lastTime = time
      return
    }
    // A backwards seek sails the boat in again.
    if (time < this.lastTime) this.spawned = false
    const dt = time > this.lastTime ? Math.min(0.05, time - this.lastTime) : 0
    this.lastTime = time
    this.time = time
    if (!this.spawned) this.spawn(time, width, height)
    this.active = true
    const fade = clamp((time - this.born) / FADE_IN)
    this.alpha = fade * fade * (3 - 2 * fade)

    // Before anyone steers, the boat motors to a resting spot below the centre.
    // Once the pointer has been seen, losing it lets the boat coast to a stop.
    let targetX = Number.NaN, targetY = Number.NaN
    if (Number.isFinite(pointerX) && Number.isFinite(pointerY)) {
      targetX = pointerX
      targetY = pointerY
      this.steered = true
    } else if (!this.steered) {
      targetX = width / 2
      targetY = height * 0.64
    }

    let desiredSpeed = 0, desiredTurn = 0
    if (Number.isFinite(targetX)) {
      const dx = targetX - this.x, dy = targetY - this.y
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
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.speed = Math.hypot(this.vx, this.vy)

    // Blend angles, not opposing vectors: wind and aft must not cancel into a flip.
    const under = clamp(this.speed / MAX_SPEED) * 0.75
    const target = WIND + wrapAngle(this.heading + Math.PI - WIND) * under
    this.pennantAngle = wrapAngle(
      this.pennantAngle + wrapAngle(target - this.pennantAngle) * -Math.expm1(-PENNANT_RESPONSE * dt),
    )

    // It enters from below the viewport; once inside, the edges hold it.
    if (!this.inside && this.y < height - EDGE * 1.5) this.inside = true
    if (this.inside) {
      this.x = clamp(this.x, EDGE, Math.max(EDGE, width - EDGE))
      this.y = clamp(this.y, EDGE, Math.max(EDGE, height - EDGE))
    }

    this.travelled += this.speed * dt
    if (this.travelled >= FOAM_GAP) {
      this.travelled = 0
      if (this.speed > 30) {
        const slot = this.foamHead
        this.foamHead = (slot + 1) % FOAM_POINTS
        this.foamX[slot] = this.x - fx * STERN
        this.foamY[slot] = this.y - fy * STERN
        this.foamSideX[slot] = -fy
        this.foamSideY[slot] = fx
        this.foamBirth[slot] = time
        this.foamStrength[slot] = clamp(this.speed / MAX_SPEED)
      }
    }
  }

  private spawn(time: number, width: number, height: number): void {
    this.spawned = true
    this.inside = false
    this.steered = false
    this.born = time
    this.x = width / 2
    this.y = height + 40
    this.heading = -Math.PI / 2
    this.turn = 0
    this.pennantAngle = WIND
    this.vx = 0
    this.vy = -MAX_SPEED * 0.6
    this.speed = MAX_SPEED * 0.6
    this.travelled = 0
    this.foamBirth.fill(-Infinity)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.alpha <= 0) return
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'

    // Foam arms widen and fade behind the transom.
    ctx.font = '400 9px "Geist Mono", monospace'
    for (let slot = 0; slot < FOAM_POINTS; slot++) {
      const age = this.time - this.foamBirth[slot]
      if (!(age >= 0 && age < FOAM_LIFE)) continue
      const life = 1 - age / FOAM_LIFE
      const strength = this.foamStrength[slot]
      const spread = 8 + age * 26 * strength
      const alpha = life * life * (0.18 + strength * 0.4) * this.alpha
      const x = this.foamX[slot], y = this.foamY[slot]
      const sideX = this.foamSideX[slot] * spread, sideY = this.foamSideY[slot] * spread
      ctx.globalAlpha = alpha
      ctx.fillText(age < 0.35 ? ':' : '.', x + sideX, y + sideY)
      ctx.fillText(age < 0.35 ? ':' : '.', x - sideX, y - sideY)
      // Stern wash churns the centre line briefly.
      if (age < 0.5) {
        ctx.globalAlpha = alpha * 0.8
        ctx.fillText(age < 0.2 ? '*' : '~', x, y)
      }
    }

    // Gentle rocking at rest, steadier under way.
    const calm = 1 - clamp(this.speed / MAX_SPEED)
    const rock = Math.sin(this.time * 1.7) * 0.05 * calm
    ctx.translate(this.x, this.y + Math.sin(this.time * 1.3) * 0.8 * calm)
    ctx.rotate(this.heading + Math.PI / 2 + rock)
    // A dark hull and dark sails hide the water glyphs underneath the ship.
    const top = (1 - MIDDLE) * LINE - LINE * 0.5, beam = 3.5 * CHAR
    const shoulder = (3.5 - MIDDLE) * LINE, quarter = (12.5 - MIDDLE) * LINE
    const stern = (13 - MIDDLE) * LINE + LINE * 0.5
    ctx.fillStyle = '#000000'
    ctx.globalAlpha = 0.9 * this.alpha
    ctx.beginPath()
    ctx.moveTo(0, top)
    ctx.lineTo(beam, shoulder)
    ctx.lineTo(beam, quarter)
    ctx.lineTo(beam * 0.7, stern)
    ctx.lineTo(-beam * 0.7, stern)
    ctx.lineTo(-beam, quarter)
    ctx.lineTo(-beam, shoulder)
    ctx.closePath()
    for (const sail of SAILS) {
      ctx.rect(-sail.half * CHAR, (sail.row - MIDDLE - 0.5) * LINE, sail.half * 2 * CHAR, LINE * 2 + BILLOW)
    }
    ctx.fill()
    // The yards stay rigid; cloth and hem bow together between their fixed ends.
    const gust = 0.55 + 0.25 * Math.sin(this.time * 0.9) + 0.2 * Math.sin(this.time * 2.3 + 1.1)
    ctx.fillStyle = '#ffffff'
    for (let sail = 0; sail < SAILS.length; sail++) {
      const { row, half } = SAILS[sail]
      const belly = BILLOW * gust * (0.6 + 0.4 * Math.sin(this.time * 1.6 + sail * 0.9))
      this.billow[sail] = belly
      const left = -half * CHAR + 2, right = half * CHAR - 2
      const yardY = (row - MIDDLE) * LINE + 2
      const hemY = (row + 1 - MIDDLE) * LINE + 2
      ctx.globalAlpha = (0.09 + belly * 0.006) * this.alpha
      ctx.beginPath()
      ctx.moveTo(left, yardY)
      ctx.lineTo(right, yardY)
      ctx.lineTo(right - CHAR, hemY)
      ctx.quadraticCurveTo(0, hemY + belly * 2, left + CHAR, hemY)
      ctx.closePath()
      ctx.fill()
    }
    ctx.font = '400 10px "Geist Mono", monospace'
    ctx.globalAlpha = 0.88 * this.alpha
    let sail = 0
    for (let row = 0; row < HULL.length; row++) {
      const y = (row - MIDDLE) * LINE
      if (sail < SAILS.length && row === SAILS[sail].row + 1) {
        // Warp the hem glyph by glyph, rather than sliding a straight row.
        for (let col = 0; col < HULL[row].length; col++) {
          const glyph = HULL[row][col]
          if (glyph === ' ') continue
          const x = (col - 7) * CHAR
          const across = x / (SAILS[sail].half * CHAR)
          const bow = Math.max(0, 1 - across * across)
          ctx.fillText(glyph, x, y + this.billow[sail] * bow)
        }
        sail++
      } else {
        ctx.fillText(HULL[row], 0, y)
      }
    }

    // World-space easing keeps the ribbon continuous through turns and braking.
    const flowAngle = this.pennantAngle - (this.heading + Math.PI / 2 + rock)
    const flowX = Math.cos(flowAngle), flowY = Math.sin(flowAngle)
    const mastY = (SAILS[1].row - MIDDLE) * LINE
    ctx.font = '600 11px "Geist Mono", monospace'
    for (let k = 1; k <= PENNANT; k++) {
      // A brighter, longer ribbon tapers to one fluttering tip.
      const wave = Math.sin(this.time * 8 - k * 1.3) * k * 0.7
      const px = flowX * k * PENNANT_STEP - flowY * wave
      const py = mastY + flowY * k * PENNANT_STEP + flowX * wave
      const halfWidth = 5 * (1 - k / PENNANT)
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(flowAngle)
      ctx.globalAlpha = (0.98 - k * 0.035) * this.alpha
      ctx.fillText('~', 0, -halfWidth)
      if (k < PENNANT) ctx.fillText('~', 0, halfWidth)
      ctx.restore()
    }

    // Wavelets lap outward from both sides of the hull, only when the ship is nearly still.
    // They sit on the open hull rows between the sails, so the canvas never covers them.
    if (calm > 0.4) {
      const lap = (this.time / LAP_PERIOD) % 1
      const fade = (calm - 0.4) / 0.6 * Math.sin(lap * Math.PI)
      const out = beam + 3 + lap * 9
      ctx.font = '400 9px "Geist Mono", monospace'
      ctx.globalAlpha = 0.4 * fade * this.alpha
      for (let side = -1; side <= 1; side += 2) {
        const arc = side < 0 ? '(' : ')'
        for (let row = 6; row <= 12; row += 3) {
          ctx.fillText(lap < 0.5 ? arc : '~', side * out, (row - MIDDLE) * LINE)
        }
      }
    }
    ctx.restore()
  }
}
