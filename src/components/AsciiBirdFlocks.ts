const FIRST_BIRTH = 1.4
const BIRTH_PERIOD = 5.5
const COHORT_LIMIT = 3
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
  preset: FlockPreset
  x: number
  y: number
  angle: number
  alpha: number
  phase: number
  spacing: number
}

function createCohort(): Cohort {
  return { active: false, preset: PRESETS[0], x: 0, y: 0, angle: 0, alpha: 0, phase: 0, spacing: 1 }
}

/** Bounded, clock-derived flocks; the river owns playback and reduced motion. */
export class AsciiBirdFlocks {
  private readonly cohorts: readonly Cohort[] = [createCohort(), createCohort(), createCohort()]

  /** Seconds since full reveal. Recomputes cohorts even after a seek or resize. */
  update(time: number, width: number, height: number, enabled: boolean): void {
    for (let slot = 0; slot < COHORT_LIMIT; slot++) this.cohorts[slot].active = false
    if (!enabled || time < FIRST_BIRTH || width <= 0 || height <= 0) return

    const latestBirth = Math.floor((time - FIRST_BIRTH) / BIRTH_PERIOD)
    const spacing = width < 640 ? 0.9 : 1
    for (let slot = 0; slot < COHORT_LIMIT; slot++) {
      const birth = latestBirth - slot
      if (birth < 0) continue
      const age = time - FIRST_BIRTH - birth * BIRTH_PERIOD
      const duration = 12 + ((birth * 7) % 6) * 0.6
      if (age < 0 || age >= duration) continue

      const cohort = this.cohorts[slot]
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

      cohort.active = true
      cohort.preset = preset
      cohort.x = direction === 1 ? -margin + progress * travel : width + margin - progress * travel
      cohort.y = height * (laneY + (progress - 0.5) * slope + Math.sin(routePhase) * bend)
      cohort.angle = Math.atan2(tangentY, direction * travel)
      cohort.alpha = edgeFade * edgeFade * (3 - 2 * edgeFade)
      cohort.phase = age * 5.2 + birth * 1.37
      cohort.spacing = spacing
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
      const dx = Math.cos(cohort.angle)
      const dy = Math.sin(cohort.angle)
      const birds = cohort.preset.birds
      for (let member = 0; member < birds.length; member++) {
        const bird = birds[member]
        const phase = cohort.phase + bird.phase
        // Members breathe within their formation, never changing its silhouette.
        const behind = bird.behind * cohort.spacing + Math.sin(phase * 0.31) * 1.3
        const side = bird.side * cohort.spacing + Math.sin(phase * 0.43) * 1.8
        const x = cohort.x - dx * behind - dy * side
        const y = cohort.y - dy * behind + dx * side
        const flap = Math.sin(phase)
        const pose = BIRD_POSES[flap > 0.4 ? 0 : flap < -0.4 ? 2 : 1]
        ctx.save()
        ctx.translate(x, y)
        // Authored facing up; rotate the beak into the route's forward tangent.
        ctx.rotate(cohort.angle + Math.PI / 2)
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
