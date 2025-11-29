// Navigation section type
export interface NavSection {
  id: string
  label: string
}

// Project type for the works section
export interface Project {
  index: string
  title: string
  meta: string
  year: number
}

// Blog post type for the stream section
export interface BlogPost {
  date: string
  title: string
}

// Experiment command for the lab terminal
export interface Experiment {
  command: string
}

// Contact link type
export interface ContactLink {
  label: string
  href: string
}

// About grid cell type
export interface AboutCell {
  type: 'stat' | 'text' | 'highlight'
  label?: string
  value?: string
  text?: string
  colSpan?: number
  rowSpan?: number
}

// Fragment info for hero section
export interface HeroFragment {
  label: string
  value: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  delay: number
}

// Mouse position state
export interface MousePosition {
  x: number
  y: number
  normalizedX: number
  normalizedY: number
}

// Color palette type
export interface ColorPalette {
  void: string
  abyss: string
  smoke: string
  ash: string
  fog: string
  mist: string
  light: string
  pure: string
}
