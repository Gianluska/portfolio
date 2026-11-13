const COLUMNS = 67
const ROWS = 45
const CHAR = 6
const LINE = 8
const WIDTH = COLUMNS * CHAR
const HEIGHT = ROWS * LINE
const REFERENCE_WIDTH = 743
const REFERENCE_HEIGHT = 661
const FIRE_RED = '#e34b4b'

type Point = readonly [number, number]

// Traced from the supplied sketch: northern inlet, western grove and southern lobe.
const COAST: readonly Point[] = [
  [300, 85], [340, 90], [379, 122], [409, 131], [414, 99], [432, 82],
  [498, 96], [546, 100], [585, 122], [590, 168], [593, 187], [615, 213],
  [611, 240], [584, 275], [535, 289], [501, 325], [469, 352], [447, 394],
  [455, 447], [464, 490], [459, 523], [435, 548], [411, 564], [408, 589],
  [384, 606], [337, 607], [299, 588], [274, 560], [263, 532], [263, 515],
  [240, 497], [214, 490], [186, 503], [143, 505], [139, 467], [116, 420],
  [109, 413], [62, 425], [44, 422], [31, 407], [34, 382], [58, 335],
  [79, 295], [97, 253], [106, 211], [122, 184], [122, 164], [118, 148],
  [129, 134], [160, 119], [200, 114], [234, 99], [272, 96],
]
const DOCK: readonly Point[] = [[499, 305], [692, 374], [674, 409], [478, 337]]
const CLEARING: readonly Point[] = [
  [300, 220], [333, 219], [355, 237], [367, 262], [380, 288], [400, 321],
  [467, 353], [451, 386], [411, 376], [381, 355], [325, 345], [287, 332],
  [270, 310], [269, 270], [279, 239],
]
const GRASS: readonly Point[] = [
  [355, 163], [392, 210], [365, 238], [422, 275], [356, 351], [311, 384],
  [264, 405], [348, 435], [388, 399], [278, 464], [424, 460], [530, 254],
  [296, 182], [480, 276], [201, 459], [370, 487], [404, 302], [295, 362],
]
const CROWN = [
  '   .--._   ',
  ' .\'  ,  `-.',
  '/ .  : .   \\',
  '(  , +  ,  )',
  '\\ . :  . _/',
  ' `-._,_.-\' ',
  '    `-\'    ',
] as const
const SLENDER_CROWN = [
  '  .-.  ',
  ' / , `.',
  '( . : )',
  ' | ,  \\',
  '(  + . )',
  ' \\ : / ',
  ' ( , ) ',
  '  `-\'  ',
] as const
const SMALL_CROWN = [
  ' .-. .-. ',
  '( , ` . )',
  '( . + , )',
  ' \\ , . / ',
  '  `-. /  ',
  '    `\'   ',
] as const
const FLAMES = [
  ['  ,  ', ' ( ) ', '( ( )', ' \\|/ '],
  ['   , ', ' ) ( ', '( ) )', ' \\|/ '],
  [' ,   ', ' ( ( ', '( ( )', ' \\|/ '],
] as const

function inside(x: number, y: number, polygon: readonly Point[]): boolean {
  let result = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) {
      result = !result
    }
  }
  return result
}

/** An ASCII chart of the reference island; only the campfire uses color. */
export class AsciiIsland {
  private readonly atlas = document.createElement('canvas')
  private ready = false

  private build(): void {
    this.atlas.width = WIDTH * 2
    this.atlas.height = HEIGHT * 2
    const ctx = this.atlas.getContext('2d')
    if (!ctx) throw new Error('The ASCII island requires a 2D canvas context')
    ctx.scale(2, 2)
    ctx.font = '400 10px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const land = new Uint8Array(COLUMNS * ROWS)
    const deck = new Uint8Array(COLUMNS * ROWS)
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const x = (col + 0.5) / COLUMNS * REFERENCE_WIDTH
        const y = (row + 0.5) / ROWS * REFERENCE_HEIGHT
        const cell = row * COLUMNS + col
        land[cell] = Number(inside(x, y, COAST))
        deck[cell] = Number(inside(x, y, DOCK))
        // An opaque, invisible backing prevents water glyphs showing through the ground.
        if (land[cell] || deck[cell]) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(col * CHAR, row * LINE, CHAR, LINE)
        }
      }
    }
    const glyph = (col: number, row: number, text: string, alpha: number): void => {
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = alpha
      ctx.fillText(text, (col + 0.5) * CHAR, (row + 0.5) * LINE)
    }
    const line = (a: Point, b: Point, text: string, alpha: number, dotted = false): void => {
      const x0 = Math.round(a[0] / REFERENCE_WIDTH * COLUMNS)
      const y0 = Math.round(a[1] / REFERENCE_HEIGHT * ROWS)
      const x1 = Math.round(b[0] / REFERENCE_WIDTH * COLUMNS)
      const y1 = Math.round(b[1] / REFERENCE_HEIGHT * ROWS)
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
      for (let step = 0; step <= steps; step++) {
        if (dotted && step % 2) continue
        glyph(Math.round(x0 + (x1 - x0) * step / steps), Math.round(y0 + (y1 - y0) * step / steps), text, alpha)
      }
    }
    for (let row = 1; row < ROWS - 1; row++) {
      for (let col = 1; col < COLUMNS - 1; col++) {
        const cell = row * COLUMNS + col
        if (!land[cell]) continue
        const up = land[cell - COLUMNS], down = land[cell + COLUMNS]
        const left = land[cell - 1], right = land[cell + 1]
        if (up && down && left && right) continue
        let shore = '|'
        if (!up) shore = !left ? '/' : !right ? '\\' : '-'
        else if (!down) shore = !left ? '\\' : !right ? '/' : '_'
        glyph(col, row, shore, 0.7)
      }
    }
    for (let i = 0; i < CLEARING.length; i++) {
      line(CLEARING[i], CLEARING[(i + 1) % CLEARING.length], '.', 0.24, true)
    }
    for (let i = 0; i < GRASS.length; i++) {
      const point = GRASS[i]
      glyph(Math.round(point[0] / REFERENCE_WIDTH * COLUMNS), Math.round(point[1] / REFERENCE_HEIGHT * ROWS), i % 3 === 0 ? ',|' : ',\'', 0.4)
    }
    const tree = (x: number, y: number, rows: readonly string[]): void => {
      const left = Math.round(x / REFERENCE_WIDTH * COLUMNS - rows[0].length / 2)
      const top = Math.round(y / REFERENCE_HEIGHT * ROWS - rows.length / 2)
      for (let row = 0; row < rows.length; row++) {
        for (let col = 0; col < rows[row].length; col++) {
          if (rows[row][col] === ' ') continue
          const cell = (top + row) * COLUMNS + left + col
          if (!land[cell]) continue
          glyph(left + col, top + row, rows[row][col], ':,+'.includes(rows[row][col]) ? 0.4 : 0.8)
        }
      }
    }
    tree(212, 178, CROWN)
    tree(154, 311, CROWN)
    tree(211, 373, SLENDER_CROWN)
    tree(167, 413, SMALL_CROWN)
    tree(475, 182, SLENDER_CROWN)
    tree(350, 525, SMALL_CROWN)

    // Rails follow the southeast-facing dock; each slash is an attached cross-plank.
    line(DOCK[0], DOCK[1], '_', 0.76)
    line(DOCK[3], DOCK[2], '_', 0.76)
    for (let plank = 0; plank <= 10; plank++) {
      const t = plank / 10
      const a: Point = [DOCK[0][0] + (DOCK[1][0] - DOCK[0][0]) * t, DOCK[0][1] + (DOCK[1][1] - DOCK[0][1]) * t]
      const b: Point = [DOCK[3][0] + (DOCK[2][0] - DOCK[3][0]) * t, DOCK[3][1] + (DOCK[2][1] - DOCK[3][1]) * t]
      line(a, b, '/', 0.64)
    }
    for (const post of DOCK) {
      glyph(Math.round(post[0] / REFERENCE_WIDTH * COLUMNS), Math.round(post[1] / REFERENCE_HEIGHT * ROWS), 'o', 0.88)
    }
    // Stone ring and crossed logs remain monochrome under the red flames.
    const ring = [' .o...o. ', 'o       o', " 'o===o' "]
    for (let row = 0; row < ring.length; row++) {
      for (let col = 0; col < ring[row].length; col++) {
        if (ring[row][col] !== ' ') glyph(24 + col, 19 + row, ring[row][col], 0.64)
      }
    }
    ctx.globalAlpha = 1
    this.ready = true
  }

  draw(
    ctx: CanvasRenderingContext2D, width: number, height: number,
    time: number, radius: number, reducedMotion: boolean,
  ): void {
    if (width <= 0 || height <= 0 || radius <= 0) return
    if (!this.ready) this.build()
    const margin = width < 640 ? 12 : Math.min(48, width * 0.035)
    const top = height < 500 ? 88 : Math.max(110, Math.min(140, height * 0.13))
    const desiredWidth = width < 640 ? Math.min(304, width * 0.78) : Math.min(420, width * 0.38)
    const scale = Math.min(desiredWidth / WIDTH, Math.max(0, height - top - 16) / HEIGHT)
    const x = width - margin - WIDTH * scale
    ctx.save()
    // The impact reveals the terrain with the water, rather than popping it in afterwards.
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.translate(x, top)
    ctx.scale(scale, scale)
    ctx.globalAlpha = 1
    ctx.drawImage(this.atlas, 0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = FIRE_RED
    ctx.globalAlpha = 0.95
    ctx.font = '400 10px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const flame = FLAMES[reducedMotion ? 0 : Math.floor(time * 6) % FLAMES.length]
    for (let row = 0; row < flame.length; row++) {
      for (let col = 0; col < flame[row].length; col++) {
        if (flame[row][col] === ' ') continue
        ctx.fillText(flame[row][col], (26 + col + 0.5) * CHAR, (16 + row + 0.5) * LINE)
      }
    }
    ctx.restore()
  }
}
