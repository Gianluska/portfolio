import { useCallback } from 'react'
import { NAV_SECTIONS } from '../../lib/constants'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  currentSection: string
  setCursorExpanded: (expanded: boolean) => void
}

interface NavVerticalProps {
  onNavigate?: (sectionId: string, index: number) => void
}

export function NavVertical({ onNavigate }: NavVerticalProps) {
  const currentSection = useAppStore((state: AppState) => state.currentSection)
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)

  const handleClick = useCallback(
    (sectionId: string, index: number) => {
      if (onNavigate) {
        onNavigate(sectionId, index)
      } else {
        // Fallback to native scroll
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    [onNavigate]
  )

  return (
    <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-2 max-md:hidden">
      {NAV_SECTIONS.map((section, index) => (
        <div
          key={section.id}
          className={`nav-dot ${currentSection === section.id ? 'active' : ''}`}
          data-label={section.label}
          onClick={() => handleClick(section.id, index)}
          onMouseEnter={() => setCursorExpanded(true)}
          onMouseLeave={() => setCursorExpanded(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClick(section.id, index)
            }
          }}
        />
      ))}
    </nav>
  )
}
