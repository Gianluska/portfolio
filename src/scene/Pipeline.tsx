import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  NoBlending,
  Scene,
  Vector3,
  WebGLRenderTarget,
  type IUniform,
  type PerspectiveCamera,
  type Texture,
} from 'three'
import { env } from '../lib/env'
import { pointer, tickPointer } from '../lib/pointer'
import { damp } from '../lib/spring'
import { Deck } from './Deck'
import { DeckRig } from './DeckRig'
import { compositeFragment, compositeVertex } from './shaders'
import { computeView, targetDpr, type Stage } from './store'

/** Intensidade do grão de filme sobre o baralho. */
const GRAIN = 0.05

interface CompositeUniforms {
  [name: string]: IUniform
  uScene: IUniform<Texture>
  uAspect: IUniform<number>
  uTime: IUniform<number>
  uGrain: IUniform<number>
  uGrainScale: IUniform<number>
}

/**
 * Dono do loop de render. A cada frame:
 * 1) o baralho é desenhado num render target (cena própria, via portal);
 * 2) um quad leva esse render target à tela com vinheta e grão;
 */
export function Pipeline({ onReady }: { onReady: (stage: Stage) => void }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const setDpr = useThree((s) => s.setDpr)
  const [quality, setQuality] = useState(1)

  const target = useMemo(() => new WebGLRenderTarget(2, 2, { samples: 4 }), [])
  const deckScene = useMemo(() => new Scene(), [])
  const compositeScene = useMemo(() => new Scene(), [])
  const composite = useMemo<CompositeUniforms>(
    () => ({
      uScene: { value: target.texture },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uGrain: { value: GRAIN },
      uGrainScale: { value: 1 },
    }),
    [target],
  )
  // uniforms vão pelo construtor: como prop, o R3F copiaria os valores (uTime ficaria parado)
  const compositeArgs = useMemo(
    () => [{ vertexShader: compositeVertex, fragmentShader: compositeFragment, uniforms: composite }] as const,
    [composite],
  )
  const stage = useMemo<Stage>(
    () => ({
      view: computeView(1, 1, 1),
      time: 0,
      closeT: 0,
      parallax: 0,
      interactive: false,
      fps: 60,
      quality: 1,
      deck: new DeckRig(),
      renderer: gl,
      camera,
    }),
    [target, gl, camera],
  )
  const lookAt = useMemo(() => new Vector3(0, 0, -3), [])
  const slow = useRef(0)

  useEffect(() => () => target.dispose(), [target])

  // resolução: limitada por um orçamento de pixels e reduzida se o frame time não segurar
  useLayoutEffect(() => {
    const want = targetDpr(size.width, size.height, quality)
    if (Math.abs(want - dpr) > 0.01) setDpr(want)
  }, [size.width, size.height, quality]) // reage só a tamanho e qualidade

  useLayoutEffect(() => {
    const view = computeView(size.width, size.height, dpr)
    stage.view = view
    stage.quality = quality
    target.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr))
    composite.uAspect.value = view.aspect
    composite.uGrainScale.value = Math.max(1, dpr)
    stage.deck.layout(view)
  }, [size.width, size.height, dpr, quality, stage, target, composite])

  const draw = () => {
    gl.setRenderTarget(target)
    gl.clear()
    gl.render(deckScene, camera)
    gl.setRenderTarget(null)
    gl.clear()
    gl.render(compositeScene, camera)
  }

  // Compila os shaders e aquece a GPU com um quadro completo, ainda invisível; só então a cena está pronta.
  useEffect(() => {
    let cancelled = false
    const { deck } = stage
    Promise.all([
      gl.compileAsync(deckScene, camera),
      gl.compileAsync(compositeScene, camera),
    ]).then(() => {
      if (cancelled) return
      deck.update(deck.tSettled, 0, 0, pointer)
      draw()
      deck.update(0, 0, 0, pointer)
      draw()
      onReady(stage)
    })
    return () => {
      cancelled = true
    }
  }, []) // uma vez por montagem


  // prioridade 1: este loop assume o render no lugar do R3F
  useFrame((_, delta) => {
    const raw = delta
    const dt = Math.min(raw, 1 / 20)
    stage.time += dt
    const time = stage.time
    stage.fps = damp(stage.fps, 1 / Math.max(raw, 1e-3), 3, dt)
    tickPointer(performance.now() / 1000)
    stage.onFrame?.(dt, time)

    const { deck } = stage

    // O paralaxe fica no fundo; as informações nunca seguem o cursor.
    const k = env.reducedMotion ? 0 : stage.parallax
    camera.position.x = damp(camera.position.x, pointer.x * 0.08 * k, 3.5, dt)
    camera.position.y = damp(camera.position.y, pointer.y * 0.05 * k, 3.5, dt)
    camera.lookAt(lookAt)
    camera.updateMatrixWorld()

    deck.update(stage.closeT, env.reducedMotion ? 0 : time, dt, pointer)
    composite.uTime.value = env.reducedMotion ? 0 : time


    draw()
    stage.onRendered?.(dt, time)

    // se a máquina não segura o framerate, troca resolução por fluidez
    if (!env.debug && stage.interactive) {
      slow.current = raw > 1 / 42 ? slow.current + 1 : Math.max(0, slow.current - 2)
      if (slow.current > 50 && quality > 0.55) {
        slow.current = 0
        setQuality((q) => q * 0.8)
      }
    }
  }, 1)

  return (
    <>
      {createPortal(<Deck rig={stage.deck} />, deckScene)}
      {createPortal(
        <mesh frustumCulled={false}>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial args={compositeArgs} depthTest={false} depthWrite={false} blending={NoBlending} />
        </mesh>,
        compositeScene,
      )}
    </>
  )
}
