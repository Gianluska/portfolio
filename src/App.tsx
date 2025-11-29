import { Suspense, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Scroll, useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { Universe } from './components/canvas'
import {
  CustomCursor,
  BootSequence,
  Coordinates,
  TimeDisplay,
  NavVertical,
  StatusBar,
  Scanlines,
  NoiseTexture,
} from './components/ui'
import {
  HeroSection,
  ProjectsSection,
  LabSection,
  AboutSection,
  BlogSection,
  ContactSection,
} from './components/sections'
import { useAppStore } from './stores/useAppStore'
import { useMousePosition } from './hooks'
import { NAV_SECTIONS } from './lib/constants'

// Define AppState type for selectors
interface AppState {
  scrollOffset: number
  setScrollOffset: (offset: number) => void
  scrollProgress: number
  setScrollProgress: (progress: number) => void
  currentSection: string
  setCurrentSection: (section: string) => void
  mousePosition: { x: number; y: number }
  setMousePosition: (position: { x: number; y: number }) => void
}

// Component to sync scroll state with store
function ScrollSync() {
  const scroll = useScroll()
  const setScrollOffset = useAppStore((state: AppState) => state.setScrollOffset)
  const setScrollProgress = useAppStore((state: AppState) => state.setScrollProgress)
  const setCurrentSection = useAppStore((state: AppState) => state.setCurrentSection)

  useFrame(() => {
    setScrollOffset(scroll.offset)
    setScrollProgress(Math.round(scroll.offset * 100))

    // Determine current section
    const totalSections = NAV_SECTIONS.length
    const sectionIndex = Math.min(
      Math.floor(scroll.offset * totalSections),
      totalSections - 1
    )
    setCurrentSection(NAV_SECTIONS[sectionIndex].id)
  })

  return null
}

// Component to sync 3D scene with scroll
function Scene() {
  const scrollOffset = useAppStore((state: AppState) => state.scrollOffset)
  return <Universe scrollOffset={scrollOffset} />
}

// Mouse position sync component
function MouseSync() {
  const { normalizedX, normalizedY } = useMousePosition()
  const setMousePosition = useAppStore((state: AppState) => state.setMousePosition)

  useEffect(() => {
    setMousePosition({ x: normalizedX, y: normalizedY })
  }, [normalizedX, normalizedY, setMousePosition])

  return null
}

function App() {
  // Handle navigation
  const handleNavigate = useCallback((_sectionId: string, index: number) => {
    // The scroll will be handled by clicking nav dots
    // This scrolls to the section based on index
    const scrollContainer = document.querySelector('[data-scroll-container]') as HTMLElement
    if (scrollContainer) {
      const totalHeight = scrollContainer.scrollHeight - window.innerHeight
      const targetScroll = (index / NAV_SECTIONS.length) * totalHeight
      scrollContainer.scrollTo({ top: targetScroll, behavior: 'smooth' })
    }
  }, [])

  return (
    <div className="w-full h-screen relative">
      {/* Mouse position sync (outside Canvas) */}
      <MouseSync />

      {/* Fixed UI overlays */}
      <CustomCursor />
      <Scanlines />
      <NoiseTexture />
      <BootSequence />
      <Coordinates />
      <TimeDisplay />
      <NavVertical onNavigate={handleNavigate} />
      <StatusBar />

      {/* Main Canvas with ScrollControls */}
      <Canvas
        className="fixed inset-0 z-[1]"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 15], fov: 75, near: 0.1, far: 1000 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ScrollControls
            pages={NAV_SECTIONS.length}
            damping={0.1}
            distance={1}
          >
            {/* Sync scroll state */}
            <ScrollSync />

            {/* 3D Scene (doesn't scroll with HTML) */}
            <Scene />

            {/* HTML Sections that scroll */}
            <Scroll html>
              <div className="w-screen" style={{ position: 'relative', zIndex: 100 }}>
                <HeroSection />
                <ProjectsSection />
                <LabSection />
                <AboutSection />
                <BlogSection />
                <ContactSection />
              </div>
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
