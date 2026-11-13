const FIRST_BIRTH = 1.4
const BIRTH_PERIOD = 5.5
const COHORT_LIMIT = 3
const MAX_BIRDS = 5
// The boat startles a whole flock; each bird flees away from it and leaves the screen.
// Measured from the hull's centre, so the reach covers the ship and its sails plus a margin.
const SCARE_RADIUS = 170
const SCARE_RADIUS_MOBILE = 120
const FLEE_ACCEL = 1100
const FLEE_SPEED = 520
const REACTION_SPREAD = 700
const PANIC_FLAP = 3
// A small beak, one body glyph and two wings; no separate neck or feather detail.
const BIRD_POSES = [
  ['\\ ^ /', ' \\o/ ', '  v  '],
  ['  ^  ', '--o--', '  v  '],
  ['  ^  ', ' /o\\ ', '/ v \\'],
] as const

interface FormationBird {
  readonly behind: number
  readonly side: number
  readonly phase: number
}

interface FlockPreset {
  readonly birds: readonly FormationBird[]
  readonly extent: number
}

// Forward/sideways offsets preserve the same formation when a route reverses.
const PRESETS: readonly FlockPreset[] = [
  { // Lone bird.
    birds: [{ behind: 0, side: 0, phase: 0 }],
    extent: 0,
  },
  { // A close, slightly staggered pair.
    birds: [
      { behind: 0, side: -19, phase: 0 },
      { behind: 24, side: 19, phase: 1.8 },
    ],
    extent: 31,
  },
  { // Two clear arms behind the leader make a five-bird V.
    birds: [
      { behind: 0, side: 0, phase: 0 },
      { behind: 32, side: -30, phase: 1.8 },
      { behind: 32, side: 30, phase: 3.4 },
      { behind: 64, side: -60, phase: 4.6 },
      { behind: 64, side: 60, phase: 6.1 },
    ],
    extent: 88,
  },
]

interface Cohort {
  active: boolean
  birth: number
  preset: FlockPreset
  alpha: number
  scared: boolean
  scaredAge: number
  panic: number
  flap: number
  readonly x: Float32Array
  readonly y: Float32Array
  readonly angle: Float32Array
  readonly phase: Float32Array
  readonly offsetX: Float32Array
  readonly offsetY: Float32Array
  readonly velocityX: Float32Array
  readonly velocityY: Float32Array
  readonly fleeX: Float32Array
  readonly fleeY: Float32Array
  readonly delay: Float32Array
}

function createCohort(): Cohort {
  return {
    active: false, birth: -1, preset: PRESETS[0], alpha: 0,
    scared: false, scaredAge: 0, panic: 0, flap: 0,
    x: new Float32Array(MAX_BIRDS), y: new Float32Array(MAX_BIRDS),
    angle: new Float32Array(MAX_BIRDS), phase: new Float32Array(MAX_BIRDS),
    offsetX: new Float32Array(MAX_BIRDS), offsetY: new Float32Array(MAX_BIRDS),
    velocityX: new Float32Array(MAX_BIRDS), velocityY: new Float32Array(MAX_BIRDS),
    fleeX: new Float32Array(MAX_BIRDS), fleeY: new Float32Array(MAX_BIRDS),
    delay: new Float32Array(MAX_BIRDS),
  }
}

function resetCohort(cohort: Cohort, birth: number): void {
  cohort.birth = birth
  cohort.scared = false
  cohort.scaredAge = 0
  cohort.panic = 0
  cohort.flap = 0
  cohort.offsetX.fill(0)
  cohort.offsetY.fill(0)
  cohort.velocityX.fill(0)
  cohort.velocityY.fill(0)
}

/** Clock-derived routes plus a small startle state; the river owns playback and reduced motion. */
export class AsciiBirdFlocks {
  private readonly cohorts: readonly Cohort[] = [createCohort(), createCohort(), createCohort()]
  private lastTime = Number.NaN

  /**
   * Seconds since full reveal, plus the boat's centre in canvas pixels (NaN when absent).
   * Routes are recomputed from the clock; only the flight away from the boat integrates.
   */
  update(
    time: number, width: number, height: number, enabled: boolean,
    threatX = Number.NaN, threatY = Number.NaN,
  ): void {
    const dt = time > this.lastTime ? Math.min(0.05, time - this.lastTime) : 0
    // A backwards seek restarts every flight from its calm route.
    if (time < this.lastTime) for (const cohort of this.cohorts) cohort.birth = -1
    this.lastTime = time
    for (let slot = 0; slot < COHORT_LIMIT; slot++) this.cohorts[slot].active = false
    if (!enabled || time < FIRST_BIRTH || width <= 0 || height <= 0) return

    const latestBirth = Math.floor((time - FIRST_BIRTH) / BIRTH_PERIOD)
    const spacing = width < 640 ? 0.9 : 1
    const scareRadius = width < 640 ? SCARE_RADIUS_MOBILE : SCARE_RADIUS
    const threat = Number.isFinite(threatX) && Number.isFinite(threatY)
    for (let offset = 0; offset < COHORT_LIMIT; offset++) {
      const birth = latestBirth - offset
      if (birth < 0) continue
      const age = time - FIRST_BIRTH - birth * BIRTH_PERIOD
      const duration = 12 + ((birth * 7) % 6) * 0.6
      if (age < 0 || age >= duration) continue

      // Slot by birth, not by recency, so a startled flock keeps its escape when a new one hatches.
      // At most three flights overlap (15 s max duration, 5.5 s period), so slots never collide.
      const cohort = this.cohorts[birth % COHORT_LIMIT]
      if (cohort.birth !== birth) resetCohort(cohort, birth)
      const preset = PRESETS[birth % PRESETS.length]
      const progress = age / duration
      const direction = birth % 2 === 0 ? 1 : -1
      // Include the farthest member, its wing width, deformation and shadow.
      const margin = preset.extent * spacing + 28
      const travel = width + margin * 2
      const routePhase = progress * Math.PI
      const lane = birth % 3
      const laneY = 0.23 + lane * 0.2 + Math.sin(birth * 1.7) * 0.014
      const slope = Math.sin(birth * 2.3 + 0.5) * 0.045
      const bend = Math.cos(birth * 1.3) * 0.035
      const tangentY = height * (slope + Math.cos(routePhase) * Math.PI * bend)
      const edgeFade = Math.max(0, Math.min(1, age / 1.1, (duration - age) / 1.1))
      const leaderX = direction === 1 ? -margin + progress * travel : width + margin - progress * travel
      const leaderY = height * (laneY + (progress - 0.5) * slope + Math.sin(routePhase) * bend)
      const routeAngle = Math.atan2(tangentY, direction * travel)
      const dx = Math.cos(routeAngle)
      const dy = Math.sin(routeAngle)
      const routeSpeed = travel / duration

      cohort.active = true
      cohort.preset = preset
      cohort.alpha = edgeFade * edgeFade * (3 - 2 * edgeFade)
      const birds = preset.birds
      for (let member = 0; member < birds.length; member++) {
        const bird = birds[member]
        const phase = age * 5.2 + birth * 1.37 + bird.phase + cohort.flap
        // Members breathe within their formation, never changing its silhouette.
        const behind = bird.behind * spacing + Math.sin(phase * 0.31) * 1.3
        const side = bird.side * spacing + Math.sin(phase * 0.43) * 1.8
        cohort.x[member] = leaderX - dx * behind - dy * side + cohort.offsetX[member]
        cohort.y[member] = leaderY - dy * behind + dx * side + cohort.offsetY[member]
        cohort.phase[member] = phase
      }

      // Any bird within reach startles the whole flock. Each flees straight away from
      // the boat, keeping a little of its heading; nearer birds react first.
      if (!cohort.scared && threat && cohort.alpha > 0.2) {
        let nearest = Infinity
        for (let member = 0; member < birds.length; member++) {
          nearest = Math.min(nearest, Math.hypot(cohort.x[member] - threatX, cohort.y[member] - threatY))
        }
        if (nearest < scareRadius) {
          cohort.scared = true
          for (let member = 0; member < birds.length; member++) {
            const awayX = cohort.x[member] - threatX
            const awayY = cohort.y[member] - threatY
            const distance = Math.hypot(awayX, awayY)
            // A bird directly over the boat bolts sideways off its route.
            const fleeX = (distance > 0.5 ? awayX / distance : -dy) + dx * 0.35
            const fleeY = (distance > 0.5 ? awayY / distance : dx) + dy * 0.35
            const length = Math.hypot(fleeX, fleeY)
            cohort.fleeX[member] = fleeX / length
            cohort.fleeY[member] = fleeY / length
            cohort.delay[member] = (distance - nearest) / REACTION_SPREAD
          }
        }
      }

      if (cohort.scared && dt > 0) {
        cohort.scaredAge += dt
        cohort.panic = Math.min(1, cohort.panic + dt * 4)
        // Frantic wingbeats while escaping.
        cohort.flap += dt * 5.2 * (PANIC_FLAP - 1) * cohort.panic
        for (let member = 0; member < birds.length; member++) {
          if (cohort.scaredAge < cohort.delay[member]) continue
          let velocityX = cohort.velocityX[member] + cohort.fleeX[member] * FLEE_ACCEL * dt
          let velocityY = cohort.velocityY[member] + cohort.fleeY[member] * FLEE_ACCEL * dt
          const speed = Math.hypot(velocityX, velocityY)
          if (speed > FLEE_SPEED) {
            velocityX *= FLEE_SPEED / speed
            velocityY *= FLEE_SPEED / speed
          }
          cohort.velocityX[member] = velocityX
          cohort.velocityY[member] = velocityY
          cohort.offsetX[member] += velocityX * dt
          cohort.offsetY[member] += velocityY * dt
          cohort.x[member] += velocityX * dt
          cohort.y[member] += velocityY * dt
        }
      }

      // Beaks follow the actual flight: calm route plus any escape velocity.
      for (let member = 0; member < birds.length; member++) {
        cohort.angle[member] = Math.atan2(
          dy * routeSpeed + cohort.velocityY[member],
          dx * routeSpeed + cohort.velocityX[member],
        )
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.font = '400 8px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let slot = COHORT_LIMIT - 1; slot >= 0; slot--) {
      const cohort = this.cohorts[slot]
      if (!cohort.active) continue
      const birds = cohort.preset.birds
      for (let member = 0; member < birds.length; member++) {
        const flap = Math.sin(cohort.phase[member])
        const pose = BIRD_POSES[flap > 0.4 ? 0 : flap < -0.4 ? 2 : 1]
        ctx.save()
        ctx.translate(cohort.x[member], cohort.y[member])
        // Authored facing up; rotate the beak into the flight direction.
        ctx.rotate(cohort.angle[member] + Math.PI / 2)
        ctx.fillStyle = '#000000'
        ctx.globalAlpha = cohort.alpha * 0.28
        for (let row = 0; row < pose.length; row++) {
          ctx.fillText(pose[row], 4, row * 5.5)
        }
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = cohort.alpha * 0.78
        for (let row = 0; row < pose.length; row++) {
          ctx.fillText(pose[row], 0, row * 5.5 - 6)
        }
        ctx.restore()
      }
    }
    ctx.restore()
  }
}
