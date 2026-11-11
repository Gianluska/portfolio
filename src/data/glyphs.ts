import data from './glyphs.json'

export interface GlyphLetter {
  ch: string
  /** Largura da célula em colunas. */
  width: number
  /** Linhas da letra na logo oficial (FIGlet Shadow). */
  official: string[]
  /** Outras fontes FIGlet, já recortadas para a mesma célula. */
  variants: string[][]
}

export interface Glyphs {
  rows: number
  cols: number
  official: string[]
  letters: GlyphLetter[]
}

export const glyphs: Glyphs = data
