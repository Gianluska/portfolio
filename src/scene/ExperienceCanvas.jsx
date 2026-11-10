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

function useSceneInputs(reducedMotion, contactActive) {
  const invalidate = useThree((state) => state.invalidate)
  const setFrameloop = useThree((state) => state.setFrameloop)
  const inputs = useRef({ hero: 0, contact: 0, pointerX: 0, pointerY: 0, active: 0 })

  useEffect(() => {
    inputs.current.active = contactActive && !reducedMotion ? 1 : 0
    invalidate()
  }, [contactActive, reducedMotion, invalidate])

  useEffect(() => {
    let heroTop = 0
    let heroHeight = window.innerHeight
    let contactTop = Number.POSITIVE_INFINITY
    let viewportHeight = window.innerHeight
    let lastY = window.scrollY
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

    const update = (y) => {
      lastY = y
      inputs.current.hero = clamp((y - heroTop) / (heroHeight * 0.82))
      inputs.current.contact = smooth(clamp((y + viewportHeight - contactTop) / (viewportHeight * 0.9)))
      if (!document.hidden) invalidate()
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
      if (reducedMotion || !finePointer.matches || event.pointerType === 'touch') return
      inputs.current.pointerX = event.clientX / window.innerWidth * 2 - 1
      inputs.current.pointerY = event.clientY / window.innerHeight * 2 - 1
      if (!document.hidden) invalidate()
    }
    const resetPointer = () => {
      inputs.current.pointerX = 0
      inputs.current.pointerY = 0
      if (!document.hidden) invalidate()
    }
    const visibilityChange = () => {
      setFrameloop(document.hidden ? 'never' : 'demand')
      if (!document.hidden) {
        update(lastY)
        invalidate()
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
  }, [reducedMotion, invalidate, setFrameloop])

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

function Sculpture({ reducedMotion, contactActive, onReady }) {
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
  const root = useRef()
  const frames = useRef()
  const inputs = useSceneInputs(reducedMotion, contactActive)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const portrait = width / height < 0.85
  const viewWidth = VIEW_HEIGHT * width / height
  const heroScale = Math.min(1.22, viewWidth * (portrait ? 0.86 : 0.74) / 9)
  const current = useRef({ hero: 0, contact: 0, pointerX: 0, pointerY: 0, active: 0, intro: 1 })
  const initialized = useRef(false)

  useEffect(() => {
    frames.current.instanceMatrix.setUsage(DynamicDrawUsage)
    invalidate()
  }, [invalidate])

  useEffect(() => {
    invalidate()
  }, [width, height, reducedMotion, invalidate])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((_, rawDelta) => {
    if (document.hidden || !root.current || !frames.current) return
    const state = current.current
    const delta = Math.min(rawDelta, 0.05)
    const damping = 1 - Math.exp(-delta * 6)
    let moving = false

    for (const key of INPUT_KEYS) {
      const target = reducedMotion && (key === 'pointerX' || key === 'pointerY' || key === 'active')
        ? 0
        : inputs.current[key]
      const difference = target - state[key]
      if (reducedMotion || !initialized.current || Math.abs(difference) < 0.0002) state[key] = target
      else {
        state[key] += difference * damping
        moving = true
      }
    }
    if (reducedMotion || state.intro < 0.0002) state.intro = 0
    else {
      state.intro *= Math.exp(-delta * 2.8)
      moving = true
    }
    initialized.current = true

    const hero = reducedMotion ? Number(state.hero >= 0.5) : smooth(state.hero)
    const contact = reducedMotion ? Number(state.contact >= 0.5) : state.contact
    const visible = (1 - hero) + contact * hero
    const scale = heroScale * (1 - hero * (1 - contact) * 0.45)
    const pointer = reducedMotion ? 0 : 1 - hero

    root.current.visible = visible > 0.005 && (!reducedMotion || contact < 0.1)
    root.current.scale.setScalar(scale)
    root.current.position.set(
      (portrait ? 0 : viewWidth * 0.1) * (1 - contact) + hero * (1 - contact) * viewWidth * 0.55,
      VIEW_HEIGHT * (portrait ? 0.075 : 0.025) * (1 - contact),
      -hero * (1 - contact) * 4,
    )
    root.current.rotation.set(
      -0.22 + state.pointerY * 0.13 * pointer + contact * 0.22,
      -0.56 + state.pointerX * 0.2 * pointer - state.intro * 0.18 + contact * 0.56,
      -0.28 + contact * 0.28,
    )

    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const t = index / (FRAME_COUNT - 1)
      const centered = t - 0.5
      const side = index < FRAME_COUNT / 2 ? -1 : 1
      const pulse = Math.sin(t * Math.PI * 2 + (1 - state.intro) * 2) * state.intro * 0.12
      const bend = Math.sin(t * Math.PI) * (0.8 + state.pointerX * 0.18 * pointer)
      const opening = contact * (VIEW_HEIGHT * 0.49 / scale + state.active * 0.3)

      transform.position.set(
        bend - 0.4,
        Math.sin(t * Math.PI * 2) * 0.23 * (1 - contact) + side * opening,
        centered * 6.5,
      )
      transform.rotation.set(
        Math.sin(t * Math.PI) * 0.18 * (1 - contact),
        centered * 0.18 * (1 - contact),
        centered * (1.55 + state.pointerX * 0.3 * pointer) * (1 - contact * 0.6) + pulse,
      )
      transform.scale.setScalar(0.88 + Math.sin(t * Math.PI) * 0.17)
      transform.updateMatrix()
      frames.current.setMatrixAt(index, transform.matrix)
    }
    frames.current.instanceMatrix.needsUpdate = true
    const luminance = 1 - contact * 0.72
    material.color.setRGB(0.32 * luminance, 0.33 * luminance, 0.31 * luminance)
    if (moving) invalidate()
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

export default function ExperienceCanvas({ reducedMotion = false, contactActive = false, onReady, onError }) {
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
        <Sculpture reducedMotion={reducedMotion} contactActive={contactActive} onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
