import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { scroll } from 'motion'
import {
  ACESFilmicToneMapping,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createLogoGeometry, LOGO_WIDTH } from './createLogoGeometry.js'
import { TrueTypeLogoLoader } from './TrueTypeLogoLoader.js'

const FONT_URL = '/fonts/JetBrainsMono-Regular.ttf'
const CAMERA = { position: [0, 0, 22], fov: 34, near: 0.1, far: 90 }
const VIEW_HEIGHT = 2 * Math.tan(34 * Math.PI / 360) * 22
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
    const room = new RoomEnvironment()
    const generator = new PMREMGenerator(gl)
    const environment = generator.fromScene(room, 0.035, 0.1, 80, { size: 128 })
    const previous = scene.environment
    scene.environment = environment.texture
    scene.environmentIntensity = 0.65
    generator.dispose()
    room.dispose()
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
  const font = useLoader(TrueTypeLogoLoader, FONT_URL)
  const layers = useMemo(() => createLogoGeometry(font), [font])
  const materials = useMemo(() => {
    const front = new MeshPhysicalMaterial({
      color: '#9c9c98',
      metalness: 0.94,
      roughness: 0.3,
      clearcoat: 0.12,
      clearcoatRoughness: 0.38,
      envMapIntensity: 1.25,
    })
    const edge = new MeshStandardMaterial({
      color: '#3b3b39', metalness: 0.9, roughness: 0.27, envMapIntensity: 1.45,
    })
    const innerFront = new MeshStandardMaterial({
      color: '#777773', metalness: 0.94, roughness: 0.34, envMapIntensity: 1.15,
    })
    const innerEdge = new MeshStandardMaterial({
      color: '#30302e', metalness: 0.92, roughness: 0.3, envMapIntensity: 1.3,
    })
    return { front, edge, innerFront, innerEdge }
  }, [])
  const root = useRef()
  const meshes = useRef([])
  const slitLight = useRef()
  const rimLight = useRef()
  const inputs = useSceneInputs(reducedMotion, contactActive)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const framing = useMemo(() => {
    const portrait = width / height < 0.85
    const viewWidth = VIEW_HEIGHT * width / height
    const heroScale = Math.min(portrait ? 0.92 : 1.22, viewWidth * (portrait ? 0.79 : 0.76) / LOGO_WIDTH)
    return { portrait, viewWidth, heroScale }
  }, [width, height])
  const current = useRef({ hero: 0, contact: 0, pointerX: 0, pointerY: 0, active: 0, intro: 1 })
  const initialized = useRef(false)

  useEffect(() => {
    invalidate()
  }, [width, height, reducedMotion, invalidate])

  useEffect(() => () => {
    for (const { geometry } of layers) geometry.dispose()
    for (const material of Object.values(materials)) material.dispose()
  }, [layers, materials])

  useFrame((_, rawDelta) => {
    if (document.hidden || !root.current) return
    const target = inputs.current
    const state = current.current
    const delta = Math.min(rawDelta, 0.05)
    const damping = 1 - Math.exp(-delta * 6)
    let moving = false
    // Scroll is native. Only the decorative world interpolates; links and
    // section positions never wait for the sculpture to catch up.
    for (const key of INPUT_KEYS) {
      const next = reducedMotion && (key === 'pointerX' || key === 'pointerY' || key === 'active') ? 0 : target[key]
      const difference = next - state[key]
      if (reducedMotion || !initialized.current || Math.abs(difference) < 0.00015) state[key] = next
      else {
        state[key] += difference * damping
        moving = true
      }
    }
    if (reducedMotion) state.intro = 0
    else if (state.intro > 0.0002) {
      state.intro *= 1 - damping
      moving = true
    } else state.intro = 0
    initialized.current = true

    const { portrait, viewWidth, heroScale } = framing
    const viewHeight = VIEW_HEIGHT
    const hero = smooth(state.hero)
    const contact = state.contact
    const visibility = (1 - hero) + contact * hero
    const contactScale = heroScale * (portrait ? 1.04 : 1.2)
    const scale = reducedMotion ? heroScale : heroScale + (contactScale - heroScale) * contact
    const parallax = reducedMotion ? 0 : (1 - hero) + contact * 0.35

    root.current.visible = visibility > 0.005 && (!reducedMotion || contact < 0.1)
    root.current.scale.setScalar(scale)
    if (reducedMotion) {
      // Reduced motion changes only visibility at section boundaries; no
      // camera travel, opening gesture, introduction, or pointer tracking.
      root.current.position.set(portrait ? 0 : viewWidth * 0.025, viewHeight * (portrait ? 0.075 : 0.055), 0)
      root.current.rotation.set(-0.09, -0.12, -0.025)
    } else {
      root.current.position.set(
        (portrait ? 0 : viewWidth * 0.025) * (1 - contact) + hero * (1 - contact) * viewWidth * 0.5,
        viewHeight * (portrait ? 0.075 : 0.055) * (1 - contact) + hero * (1 - contact) * 0.7,
        -hero * (1 - contact) * 4,
      )
      root.current.rotation.set(
        -0.09 + state.pointerY * 0.055 * parallax + contact * 0.33,
        -0.12 - hero * (1 - contact) * 0.95 + state.pointerX * 0.1 * parallax - state.intro * 0.13 + contact * 0.12,
        -0.025 + contact * 0.025,
      )
    }

    for (let index = 0; index < layers.length; index += 1) {
      const descriptor = layers[index]
      const mesh = meshes.current[index]
      const side = descriptor.half === 0 ? 1 : -1
      const openingDistance = portrait ? viewHeight * 0.28 / scale : 3.5
      const opening = reducedMotion ? 0 : contact * (openingDistance + state.active * 0.24)
      mesh.position.y = side * opening
      mesh.position.z = reducedMotion ? 0 : contact * descriptor.layer * -0.19
      mesh.rotation.x = reducedMotion ? 0 : side * contact * (0.1 + descriptor.layer * 0.025)
    }
    // A high grazing strip keeps the graphite readable without turning it
    // into a mirror; the contact seam brightens in response to the address.
    const luminance = (0.12 + visibility * 0.88) * (1 - contact * 0.65)
    materials.front.color.setRGB(0.333 * luminance, 0.333 * luminance, 0.32 * luminance)
    materials.edge.color.setRGB(0.044 * luminance, 0.044 * luminance, 0.041 * luminance)
    materials.innerFront.color.setRGB(0.184 * luminance, 0.184 * luminance, 0.172 * luminance)
    materials.innerEdge.color.setRGB(0.03 * luminance, 0.03 * luminance, 0.027 * luminance)
    slitLight.current.intensity = contact * (reducedMotion ? 22 : 22 + state.active * 18)
    rimLight.current.intensity = 45 + contact * 12
    if (moving) invalidate()
  })

  return (
    <>
      <StudioEnvironment />
      <RenderReady onReady={onReady} />
      <ambientLight intensity={0.16} />
      <directionalLight position={[-5, 7, 9]} intensity={3.4} color="#f6f6f1" />
      <directionalLight position={[7, 1, -4]} intensity={4} color="#d4d4d2" />
      <pointLight ref={rimLight} position={[-7, 3, 1]} intensity={45} decay={2} distance={28} color="#ffffff" />
      <pointLight position={[6, -5, 5]} intensity={50} decay={2} distance={25} color="#c5c5c0" />
      <pointLight ref={slitLight} position={[0, 0, 1.6]} intensity={0} distance={14} decay={2} color="#ffffff" />
      <group ref={root} dispose={null}>
        {layers.map(({ geometry, layer, half }, index) => (
          <mesh
            key={`${layer}-${half}`}
            ref={(mesh) => { meshes.current[index] = mesh }}
            geometry={geometry}
            material={layer === 0 ? [materials.front, materials.edge] : [materials.innerFront, materials.innerEdge]}
          />
        ))}
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
        gl.toneMappingExposure = 1.18
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
