import opentype from 'opentype.js'
import { FileLoader, Loader, ShapePath } from 'three'

// Three's TTFLoader imports its parser from a CDN. Use the bundled parser and
// the same local font as the DOM instead, decoding only the identity's glyphs.
export class TrueTypeLogoLoader extends Loader {
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager)
    loader.setPath(this.path)
    loader.setResponseType('arraybuffer')
    loader.setRequestHeader(this.requestHeader)
    loader.setWithCredentials(this.withCredentials)
    loader.load(url, (buffer) => {
      try {
        onLoad(this.parse(buffer))
      } catch (error) {
        onError?.(error)
        this.manager.itemError(url)
      }
    }, onProgress, onError)
  }

  parse(buffer) {
    const font = opentype.parse(buffer)
    const glyphs = new Map()
    for (const character of [' ', '|', '\\', '/', '_', '<']) {
      const glyph = font.charToGlyph(character)
      if (!glyph.index && character !== ' ') {
        throw new Error(`The sculpture font has no ${character} glyph.`)
      }
      const path = new ShapePath()
      const scale = 1 / font.unitsPerEm
      for (const command of glyph.path.commands) {
        switch (command.type) {
          case 'M':
            path.moveTo(command.x * scale, command.y * scale)
            break
          case 'L':
            path.lineTo(command.x * scale, command.y * scale)
            break
          case 'Q':
            path.quadraticCurveTo(command.x1 * scale, command.y1 * scale, command.x * scale, command.y * scale)
            break
          case 'C':
            path.bezierCurveTo(
              command.x1 * scale, command.y1 * scale,
              command.x2 * scale, command.y2 * scale,
              command.x * scale, command.y * scale,
            )
            break
          case 'Z':
            path.currentPath.closePath()
            break
        }
      }
      glyphs.set(character, { shapes: path.toShapes(), advance: glyph.advanceWidth * scale })
    }
    return { glyphs }
  }
}
