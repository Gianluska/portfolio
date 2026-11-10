import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { scroll } from 'motion'
import {
  ACESFilmicToneMapping,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
} from 'three'
import { createApertureGeometry } from './createApertureGeometry.js'

const CAMERA = { position: [0, 0, 17], fov: 40, near: 0.1, far: 70 }
const VIEW_HEIGHT = 2 * Math.tan(40 * Math.PI / 360) * 17
const FRAME_COUNT = 56
const INPUT_KEYS = ['hero', 'contact', 'pointerX', 'pointerY', 'active']
const clamp = (value) => Math.max(0, Math.min(1, value))
const smooth = (value) => value * value * (3 - 2 * value)
const sculptureVisible = (inputs) => {
  const hero = smooth(inputs.hero)
  return (1 - hero) + inputs.contact * hero > 0.005
}

function useSceneInputs(reducedMotion, motionPaused, contactActive) {
  const invalidate = useThree((state) => state.invalidate)
  const setFrameloop = useThree((state) => state.setFrameloop)
  const inputs = useRef({
    hero: 0, contact: 0, pointerX: 0, pointerY: 0, active: 0, clockReset: true,
  })

  useEffect(() => {
    inputs.current.active = contactActive ? 1 : 0
    inputs.current.clockReset = true
    if (!document.hidden && sculptureVisible(inputs.current)) invalidate()
  }, [contactActive, reducedMotion, motionPaused, invalidate])

  useEffect(() => {
    let heroTop = 0
    let heroHeight = window.innerHeight
    let contactTop = Number.POSITIVE_INFINITY
    let viewportHeight = window.innerHeight
    let lastY = window.scrollY
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

    const update = (y) => {
      const wasVisible = sculptureVisible(inputs.current)
      lastY = y
      inputs.current.hero = clamp((y - heroTop) / (heroHeight * 0.82))
      inputs.current.contact = smooth(clamp((y + viewportHeight - contactTop) / (viewportHeight * 0.9)))
      const visible = sculptureVisible(inputs.current)
      if (visible !== wasVisible) inputs.current.clockReset = true
      if (!document.hidden && (wasVisible || visible)) invalidate()
    }
    const measure = () => {
      const hero = document.getElementById('hero')
      const contact = document.getElementById('contact')
      viewportHeight = window.innerHeight
      heroTop = hero ? hero.getBoundingClientRect().top + window.scrollY : 0
      heroHeight = hero?.offsetHeight || viewportHeight
      contactTop = contact ? contact.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY
      update(window.scrollY)
    }
    const pointerMove = (event) => {
      if (reducedMotion || motionPaused || !finePointer.matches || event.pointerType === 'touch') return
      inputs.current.pointerX = event.clientX / window.innerWidth * 2 - 1
      inputs.current.pointerY = event.clientY / window.innerHeight * 2 - 1
      if (!document.hidden && sculptureVisible(inputs.current)) invalidate()
    }
    const resetPointer = () => {
      if (reducedMotion || motionPaused) return
      inputs.current.pointerX = 0
      inputs.current.pointerY = 0
      if (!document.hidden && sculptureVisible(inputs.current)) invalidate()
    }
    const visibilityChange = () => {
      inputs.current.clockReset = true
      setFrameloop(document.hidden ? 'never' : 'demand')
      if (!document.hidden) {
        update(lastY)
        if (sculptureVisible(inputs.current)) invalidate()
      }
    }
    measure()
    const stopScroll = scroll((_, info) => update(info.y.current), { axis: 'y' })
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('resize', measure, { passive: true })
    window.addEventListener('pointermove', pointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', resetPointer)
    window.addEventListener('blur', resetPointer)
    finePointer.addEventListener('change', resetPointer)
    document.addEventListener('visibilitychange', visibilityChange)
    visibilityChange()
    return () => {
      stopScroll()
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', pointerMove)
      document.documentElement.removeEventListener('pointerleave', resetPointer)
      window.removeEventListener('blur', resetPointer)
      finePointer.removeEventListener('change', resetPointer)
      document.removeEventListener('visibilitychange', visibilityChange)
    }
  }, [reducedMotion, motionPaused, invalidate, setFrameloop])

  return inputs
}

function StudioEnvironment() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const studio = new Scene()
    studio.background = new Color('#080808')
    const panelGeometry = new PlaneGeometry(1, 1)
    const panelMaterials = []

    function softbox(position, size, luminance) {
      const material = new MeshBasicMaterial({
        color: new Color(luminance, luminance, luminance),
        side: DoubleSide,
      })
      const panel = new Mesh(panelGeometry, material)
      panel.position.set(...position)
      panel.scale.set(size[0], size[1], 1)
      panel.lookAt(0, 0, 0)
      studio.add(panel)
      panelMaterials.push(material)
    }

    softbox([-4, 5, 4], [3, 8], 7)
    softbox([5, 1, -2], [1.5, 10], 10)
    softbox([0, -4, 2], [7, 1], 3)
    softbox([-5, -1, -4], [2, 5], 4)

    const generator = new PMREMGenerator(gl)
    const environment = generator.fromScene(studio, 0.025, 0.1, 50)
    const previous = scene.environment
    scene.environment = environment.texture
    scene.environmentIntensity = 0.85
    generator.dispose()
    panelGeometry.dispose()
    panelMaterials.forEach((material) => material.dispose())
    invalidate()

    return () => {
      scene.environment = previous
      environment.dispose()
    }
  }, [gl, scene, invalidate])

  return null
}

function ContextLifecycle({ onError }) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    const canvas = gl.domElement
    const contextLost = (event) => {
      event.preventDefault()
      onError?.(new Error('The sculpture WebGL context was lost.'))
    }
    canvas.addEventListener('webglcontextlost', contextLost)
    return () => canvas.removeEventListener('webglcontextlost', contextLost)
  }, [gl, onError])
  return null
}

function RenderReady({ onReady }) {
  const invalidate = useThree((state) => state.invalidate)
  const frames = useRef(0)
  const readyRequest = useRef(0)
  const ready = useRef(false)

  useEffect(() => () => cancelAnimationFrame(readyRequest.current), [])

  useFrame(() => {
    if (ready.current || document.hidden) return
    frames.current += 1
    if (frames.current < 2) {
      invalidate()
      return
    }
    ready.current = true
    // This runs after the first asset-complete frame has actually reached the
    // renderer, rather than announcing readiness from Canvas.onCreated.
    readyRequest.current = requestAnimationFrame(() => onReady?.())
  })

  return null
}

function Sculpture({ reducedMotion, contactActive, unfolded, motionPaused, onReady }) {
  const geometry = useMemo(createApertureGeometry, [])
  const material = useMemo(() => new MeshPhysicalMaterial({
    color: '#9b9d98',
    metalness: 1,
    roughness: 0.25,
    anisotropy: 0.65,
    anisotropyRotation: Math.PI / 4,
    clearcoat: 0.15,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.15,
  }), [])
  const transform = useMemo(() => new Object3D(), [])
  const profiles = useMemo(() => {
    const values = new Float32Array(FRAME_COUNT * 5)
    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const t = index / (FRAME_COUNT - 1)
      const offset = index * 5
      values[offset] = t
      values[offset + 1] = t - 0.5
      values[offset + 2] = Math.sin(t * Math.PI)
      values[offset + 3] = Math.sin(t * Math.PI * 2)
      values[offset + 4] = t * Math.PI * 2.3
    }
    return values
  }, [])
  const root = useRef()
  const frames = useRef()
  const inputs = useSceneInputs(reducedMotion, motionPaused, contactActive)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const portrait = width / height < 0.85
  const viewWidth = VIEW_HEIGHT * width / height
  const heroScale = Math.min(1.22, viewWidth * (portrait ? 0.86 : 0.74) / 9)
  const current = useRef({
    hero: 0, contact: 0, pointerX: 0, pointerY: 0, active: 0,
    unfold: Number(unfolded), unfoldCommand: unfolded, phase: 0.9, running: false,
  })
  const initialized = useRef(false)

  useEffect(() => {
    frames.current.instanceMatrix.setUsage(DynamicDrawUsage)
    invalidate()
  }, [invalidate])

  useEffect(() => {
    if (!document.hidden && sculptureVisible(inputs.current)) invalidate()
  }, [width, height, reducedMotion, motionPaused, unfolded, inputs, invalidate])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((_, rawDelta) => {
    if (document.hidden || !root.current || !frames.current) return
    const state = current.current
    const target = inputs.current
    const staticMotion = reducedMotion || motionPaused
    const targetVisible = sculptureVisible(target)
    // The first frame after demand sleep contributes no elapsed wall time.
    // Phase belongs to this sculpture, not R3F's continuously elapsed clock.
    const delta = state.running && !target.clockReset ? Math.min(rawDelta, 0.25) : 0
    const settlingDelta = Math.min(rawDelta, 0.25)
    const damping = 1 - Math.exp(-settlingDelta * 6)
    let moving = false

    for (const key of INPUT_KEYS) {
      if (motionPaused && (key === 'pointerX' || key === 'pointerY')) continue
      const next = reducedMotion && (key === 'pointerX' || key === 'pointerY') ? 0 : target[key]
      const difference = next - state[key]
      if (staticMotion || !initialized.current || !targetVisible || Math.abs(difference) < 0.0002) {
        state[key] = next
      } else {
        state[key] += difference * damping
        moving = true
      }
    }

    const unfoldTarget = Number(unfolded)
    const unfoldDifference = unfoldTarget - state.unfold
    const unfoldCommandChanged = unfolded !== state.unfoldCommand
    state.unfoldCommand = unfolded
    if (reducedMotion || !initialized.current || !targetVisible || (motionPaused && unfoldCommandChanged) || Math.abs(unfoldDifference) < 0.0002) {
      state.unfold = unfoldTarget
    } else if (!motionPaused) {
      state.unfold += Math.sign(unfoldDifference) * Math.min(Math.abs(unfoldDifference), settlingDelta / 1.65)
      moving = true
    }
    initialized.current = true
    target.clockReset = false

    const hero = staticMotion ? Number(state.hero >= 0.5) : smooth(state.hero)
    const contact = staticMotion ? Number(state.contact >= 0.5) : state.contact
    const visible = (1 - hero) + contact * hero
    root.current.visible = visible > 0.005
    const continuous = !staticMotion && targetVisible && root.current.visible
    if (continuous) state.phase = (state.phase + delta * 0.62) % (Math.PI * 2)
    state.running = continuous

    if (!root.current.visible) {
      if (moving && targetVisible) invalidate()
      return
    }

    const expansion = smooth(state.unfold)
    const scale = heroScale * (1 - expansion * 0.23 * (1 - contact)) * (1 - hero * (1 - contact) * 0.45)
    const pointer = reducedMotion ? 0 : 1 - hero
    const phase = reducedMotion ? 0.9 : state.phase
    const waveStrength = (1 - contact * 0.94) * (1 - expansion * 0.35)

    root.current.scale.setScalar(scale)
    root.current.position.set(
      (portrait ? 0 : viewWidth * 0.1) * (1 - contact) + hero * (1 - contact) * viewWidth * 0.55,
      VIEW_HEIGHT * (portrait ? 0.075 : 0.025) * (1 - contact),
      -hero * (1 - contact) * 4,
    )
    root.current.rotation.set(
      -0.22 + state.pointerY * 0.025 * pointer + contact * 0.22,
      -0.56 + state.pointerX * 0.035 * pointer + contact * 0.56,
      -0.28 + contact * 0.28,
    )

    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const offset = index * 5
      const t = profiles[offset]
      const centered = profiles[offset + 1]
      const arch = profiles[offset + 2]
      const side = index < FRAME_COUNT / 2 ? -1 : 1
      // A traveling front reveals the depth sequentially, then retraces its
      // path on reassembly. The plate geometry itself is never replaced.
      const fan = smooth(clamp((state.unfold - t * 0.36) / 0.64)) * (1 - contact)
      const localPointer = smooth(clamp(1 - Math.abs(t - (state.pointerX * 0.5 + 0.5)) / 0.32)) * pointer
      const wavePhase = profiles[offset + 4] - phase + localPointer * state.pointerY * 0.8
      const wave = Math.sin(wavePhase) * waveStrength
      const crest = Math.cos(wavePhase) * waveStrength
      const amplitude = 1 + localPointer * Math.abs(state.pointerY) * 0.8
      const opening = contact * (VIEW_HEIGHT * 0.49 / scale + state.active * 0.3)

      transform.position.set(
        arch * 0.8 - 0.4 + wave * 0.16 * amplitude + centered * fan * 0.7,
        profiles[offset + 3] * 0.23 * (1 - contact) + crest * 0.09 * amplitude + centered * fan * 1.15 + side * opening,
        centered * (6.5 + fan * 5.2) + wave * 0.18,
      )
      transform.rotation.set(
        arch * 0.18 * (1 - contact) + crest * 0.095 * amplitude + centered * fan * 0.32,
        centered * 0.18 * (1 - contact) + wave * 0.11 * amplitude + centered * fan * 0.95,
        centered * 1.55 * (1 - contact * 0.6) + wave * 0.15 * amplitude + centered * fan * 0.8,
      )
      transform.scale.setScalar(0.88 + arch * 0.17)
      transform.updateMatrix()
      frames.current.setMatrixAt(index, transform.matrix)
    }
    frames.current.instanceMatrix.needsUpdate = true
    const luminance = 1 - contact * 0.72
    material.color.setRGB(0.32 * luminance, 0.33 * luminance, 0.31 * luminance)
    if (continuous || moving) invalidate()
  })

  return (
    <>
      <StudioEnvironment />
      <RenderReady onReady={onReady} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[-4, 6, 7]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[5, -2, -4]} intensity={2} color="#d4d5d0" />
      <group ref={root} dispose={null}>
        <instancedMesh ref={frames} args={[geometry, material, FRAME_COUNT]} frustumCulled={false} />
      </group>
    </>
  )
}

export default function ExperienceCanvas({
  reducedMotion = false,
  contactActive = false,
  unfolded = false,
  motionPaused = false,
  onReady,
  onError,
}) {
  return (
    <Canvas
      camera={CAMERA}
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
        gl.setClearColor(new Color('#070707'), 0)
      }}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <ContextLifecycle onError={onError} />
      <Suspense fallback={null}>
        <Sculpture
          reducedMotion={reducedMotion}
          contactActive={contactActive}
          unfolded={unfolded}
          motionPaused={motionPaused}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  )
}
