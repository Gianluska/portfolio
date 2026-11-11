import { useMemo } from 'react'
import { DoubleSide } from 'three'
import type { DeckRig } from './DeckRig'
import { deckFragment, deckVertex } from './shaders'

/** O baralho: uma malha instanciada de lajes e a tampa que fecha o fundo do túnel. */
export function Deck({ rig }: { rig: DeckRig }) {
  // uniforms vão pelo construtor: como prop, o R3F copiaria os valores e as animações não chegariam ao shader
  const slab = useMemo(
    () => [{ vertexShader: deckVertex, fragmentShader: deckFragment, uniforms: rig.uniforms }] as const,
    [rig],
  )
  return (
    <group ref={rig.bindGroup}>
      <mesh geometry={rig.geometry} frustumCulled={false}>
        <shaderMaterial args={slab} side={DoubleSide} />
      </mesh>
      <mesh ref={rig.bindCap} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#020202" />
      </mesh>
    </group>
  )
}
