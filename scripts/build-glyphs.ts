// Gera src/data/glyphs.json: cada letra da logo "lvsk" em várias fontes FIGlet,
// todas encaixadas na mesma célula que a letra ocupa na logo oficial (Shadow).
// Uso: node scripts/build-glyphs.ts [--print]   (ou npm run glyphs)
import figlet from 'figlet'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/glyphs.json')
const WORD = 'lvsk'
const ROWS = 4

// Logo oficial: FIGlet "Shadow". As colunas de cada letra são fatias fixas dela.
const OFFICIAL = [
  '  |               |    ',
  '  | \\ \\   /  __|  |  / ',
  '  |  \\ \\ / \\__ \\    <  ',
  ' _|   \\_/  ____/ _|\\_\\ ',
]
const SLOTS: [number, number][] = [
  [0, 4], // l
  [4, 11], // v
  [11, 16], // s
  [16, 23], // k
]

// Candidatas; só entram as que cabem na célula e têm pelo menos 3 linhas.
const CANDIDATES = [
  'Small',
  'Small Slant',
  'Small Shadow',
  'Small Script',
  'Chunky',
  'Thin',
  'Stforek',
  'Stampatello',
  'Cybermedium',
  'JS Stick Letters',
  'Rectangles',
  'Cyberlarge',
  'Rounded',
  'Graceful',
  'Tinker-Toy',
  'Double Shorts',
  'Efti Italic',
  'Santa Clara',
  'Glenyn',
  'Linux',
  'Fuzzy',
  'Double',
  'Small Caps',
  'Bell',
  'Puffy',
  'Serifcap',
  'Invita',
  'Ogre',
]

const render = (text: string, font: string): string[] =>
  figlet.textSync(text, { font: font as figlet.Fonts, horizontalLayout: 'default' }).split('\n')

interface Glyph {
  rows: string[]
  width: number
}

function trim(lines: string[]): Glyph | null {
  let rows = lines.map((l) => l.replace(/\s+$/, ''))
  while (rows.length && !rows[0].trim()) rows.shift()
  while (rows.length && !rows[rows.length - 1].trim()) rows.pop()
  if (!rows.length) return null
  const left = Math.min(...rows.filter((r) => r.trim()).map((r) => r.search(/\S/)))
  rows = rows.map((r) => r.slice(left))
  const width = Math.max(...rows.map((r) => r.length))
  return { rows: rows.map((r) => r.padEnd(width)), width }
}

function fit(glyph: Glyph | null, cellW: number): string[] | null {
  if (!glyph || glyph.width > cellW || glyph.rows.length > ROWS || glyph.rows.length < 3) return null
  const padL = Math.floor((cellW - glyph.width) / 2)
  const body = glyph.rows.map((r) => (' '.repeat(padL) + r).padEnd(cellW))
  const top = Array.from({ length: ROWS - body.length }, () => ' '.repeat(cellW)) // alinha na base
  return [...top, ...body]
}

const check = render(WORD, 'Shadow')
OFFICIAL.forEach((row, i) => {
  if ((check[i] ?? '').padEnd(row.length) !== row) {
    throw new Error(`A logo oficial não confere com FIGlet Shadow na linha ${i}`)
  }
})

const letters = [...WORD].map((ch: string, i: number) => {
  const [a, b] = SLOTS[i]
  const cellW = b - a
  const official = OFFICIAL.map((r) => r.slice(a, b))
  const seen = new Set([official.join('\n')])
  const variants: { font: string; rows: string[] }[] = []
  for (const font of CANDIDATES) {
    let cell: string[] | null
    try {
      cell = fit(trim(render(ch, font)), cellW)
    } catch {
      continue
    }
    if (!cell) continue
    const key = cell.join('\n')
    if (seen.has(key)) continue
    seen.add(key)
    variants.push({ font, rows: cell })
  }
  return { ch, width: cellW, official, variants }
})

const out = {
  rows: ROWS,
  cols: OFFICIAL[0].length,
  official: OFFICIAL,
  letters: letters.map(({ ch, width, official, variants }) => ({
    ch,
    width,
    official,
    variants: variants.map((v) => v.rows),
  })),
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')

if (process.argv.includes('--print')) {
  for (const l of letters) {
    console.log(`\n### ${l.ch} (largura ${l.width}) — ${l.variants.length} variantes`)
    for (const v of l.variants) console.log(`-- ${v.font}\n${v.rows.map((r) => `[${r}]`).join('\n')}`)
  }
}
console.log(letters.map((l) => `${l.ch}: ${l.variants.length}`).join('  '), '→', OUT)
