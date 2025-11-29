import { create } from 'zustand'

interface AppState {
  // Boot sequence
  bootComplete: boolean
  setBootComplete: (complete: boolean) => void

  // Cursor
  cursorExpanded: boolean
  setCursorExpanded: (expanded: boolean) => void

  // Navigation
  currentSection: string
  setCurrentSection: (section: string) => void

  // Scroll
  scrollProgress: number
  setScrollProgress: (progress: number) => void
  scrollOffset: number
  setScrollOffset: (offset: number) => void

  // Mouse position (normalized -1 to 1)
  mousePosition: { x: number; y: number }
  setMousePosition: (position: { x: number; y: number }) => void
}

export const useAppStore = create<AppState>()((set) => ({
  // Boot sequence
  bootComplete: false,
  setBootComplete: (complete: boolean) => set({ bootComplete: complete }),

  // Cursor
  cursorExpanded: false,
  setCursorExpanded: (expanded: boolean) => set({ cursorExpanded: expanded }),

  // Navigation
  currentSection: 'hero',
  setCurrentSection: (section: string) => set({ currentSection: section }),

  // Scroll
  scrollProgress: 0,
  setScrollProgress: (progress: number) => set({ scrollProgress: progress }),
  scrollOffset: 0,
  setScrollOffset: (offset: number) => set({ scrollOffset: offset }),

  // Mouse position
  mousePosition: { x: 0, y: 0 },
  setMousePosition: (position: { x: number; y: number }) =>
    set({ mousePosition: position }),
}))

// Selector hooks for performance
export const useBootComplete = () =>
  useAppStore((state: AppState) => state.bootComplete)
export const useCursorExpanded = () =>
  useAppStore((state: AppState) => state.cursorExpanded)
export const useCurrentSection = () =>
  useAppStore((state: AppState) => state.currentSection)
export const useScrollProgress = () =>
  useAppStore((state: AppState) => state.scrollProgress)
export const useScrollOffset = () =>
  useAppStore((state: AppState) => state.scrollOffset)
export const useMousePositionStore = () =>
  useAppStore((state: AppState) => state.mousePosition)
