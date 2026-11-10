import { Box3, BufferAttribute, BufferGeometry, ExtrudeGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ASCII_LOGO } from '../data/identity.js'

export const LAYER_COUNT = 5
export const LOGO_WIDTH = 16

function groupGeometry(geometry, group) {
  const result = new BufferGeometry()
  for (const name of ['position', 'normal', 'uv']) {
    const attribute = geometry.getAttribute(name)
    result.setAttribute(name, new BufferAttribute(
      attribute.array.subarray(group.start * attribute.itemSize, (group.start + group.count) * attribute.itemSize),
      attribute.itemSize,
    ))
  }
  return result
}

export function createLogoGeometry(font) {
  const lines = ASCII_LOGO.split('\n')
  const advance = font.glyphs.get(' ').advance
  const size = 1.6
  const lineHeight = 1.55
  const templates = new Map()
  const bounds = new Box3()
  const point = new Vector3()

  for (const [character, glyph] of font.glyphs) {
    if (character === ' ') continue
    const geometry = new ExtrudeGeometry(glyph.shapes, {
      depth: 0.19 / size,
      bevelEnabled: true,
      bevelThickness: 0.018 / size,
      bevelSize: 0.014 / size,
      bevelSegments: 2,
      curveSegments: 5,
      steps: 1,
    })
    geometry.scale(size, size, size)
    templates.set(character, geometry)
  }

  lines.forEach((line, row) => {
    Array.from(line).forEach((character, column) => {
      if (character === ' ') return
      const template = templates.get(character)
      if (!template.boundingBox) template.computeBoundingBox()
      point.copy(template.boundingBox.min).add({ x: column * advance * size, y: -row * lineHeight, z: 0 })
      bounds.expandByPoint(point)
      point.copy(template.boundingBox.max).add({ x: column * advance * size, y: -row * lineHeight, z: 0 })
      bounds.expandByPoint(point)
    })
  })
  const center = bounds.getCenter(new Vector3())
  const normalization = LOGO_WIDTH / (bounds.max.x - bounds.min.x)
  const layers = []

  for (let layer = 0; layer < LAYER_COUNT; layer += 1) {
    const depth = layer * 0.31
    // Correct the rear layers for perspective at the front alignment. Moving
    // the viewpoint reveals real separated solids, not copies of flat text.
    const compensation = (22 + depth) / 22
    for (let half = 0; half < 2; half += 1) {
      const caps = []
      const sides = []
      lines.forEach((line, row) => {
        if ((row < 2 ? 0 : 1) !== half) return
        Array.from(line).forEach((character, column) => {
          if (character === ' ') return
          const geometry = templates.get(character).clone()
          geometry.translate(column * advance * size - center.x, -row * lineHeight - center.y, -0.21)
          geometry.scale(normalization * compensation, normalization * compensation, 1)
          geometry.translate(0, 0, -depth)
          for (const group of geometry.groups) {
            const part = groupGeometry(geometry, group)
            const collection = group.materialIndex === 0 ? caps : sides
            collection.push(part)
          }
          geometry.dispose()
        })
      })
      const capGeometry = mergeGeometries(caps)
      const sideGeometry = mergeGeometries(sides)
      const geometry = mergeGeometries([capGeometry, sideGeometry], true)
      geometry.computeBoundingSphere()
      layers.push({ geometry, layer, half })
      for (const part of caps) part.dispose()
      for (const part of sides) part.dispose()
      capGeometry.dispose()
      sideGeometry.dispose()
    }
  }
  for (const template of templates.values()) template.dispose()
  return layers
}
