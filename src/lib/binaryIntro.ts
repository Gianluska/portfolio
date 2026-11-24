import { createEffect, effectNames, registerEffect, type EffectCell, type EffectFrame } from 'tte.js'

export const INTRO_EFFECT = 'portfoliobinary'
export const INTRO_VARIANTS = effectNames().filter((name) => name !== INTRO_EFFECT)

function binaryCells() {
  const output: EffectCell[] = []
  const slots: EffectCell[] = []
  return (cells: readonly EffectCell[] | undefined): EffectCell[] => {
    if (!cells) {
      output.length = 0
      return output
    }
    output.length = cells.length
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      const char = cell.character
      if (char === '0' || char === '1' || char === ' ' || !char) {
        output[i] = cell
        continue
      }
      // Preserve the effect's geometry and opacity, without mutating its own cells.
      const slot = slots[i] ??= { character: '', row: 0, column: 0 }
      slot.character = char.charCodeAt(0) % 2 ? '1' : '0'
      slot.row = cell.row
      slot.column = cell.column
      slot.alpha = cell.alpha
      slot.color = cell.color
      slot.glow = cell.glow
      output[i] = slot
    }
    return output
  }
}

registerEffect(INTRO_EFFECT, (context) => {
  const effect = createEffect(context.options.sourceEffect, context)
  const cells = binaryCells(), particles = binaryCells()
  const frame: EffectFrame = { cells: [] }
  return {
    render(progress, elapsed) {
      const state = effect.render(progress, elapsed)
      frame.cells = cells(state.cells)
      frame.particles = particles(state.particles)
      frame.beam = state.beam
      return frame
    },
  }
})
