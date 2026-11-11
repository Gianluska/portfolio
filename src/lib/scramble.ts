const GLYPHS = '/\\|_<>-=+*^~:;.'

export const randomGlyph = (): string => GLYPHS[(Math.random() * GLYPHS.length) | 0]
