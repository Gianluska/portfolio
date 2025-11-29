import { HERO_FRAGMENTS } from '../../../lib/constants'
import { useAppStore } from '../../../stores/useAppStore'
import { useMousePosition } from '../../../hooks'

interface AppState {
  setCursorExpanded: (expanded: boolean) => void
}

export function InfoFragments() {
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)
  const { normalizedX, normalizedY } = useMousePosition()

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'top-[15%] left-[8%]'
      case 'top-right':
        return 'top-[20%] right-[8%]'
      case 'bottom-left':
        return 'bottom-[25%] left-[10%]'
      case 'bottom-right':
        return 'bottom-[20%] right-[10%]'
      default:
        return ''
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-50 max-md:hidden">
      {HERO_FRAGMENTS.map((fragment, index) => (
        <div
          key={fragment.label}
          className={`fragment-card pointer-events-auto animate-[fragmentAppear_1s_ease_forwards] ${getPositionClasses(fragment.position)}`}
          style={{
            animationDelay: `${fragment.delay}ms`,
            transform: `translate(${normalizedX * (index + 1) * 5}px, ${normalizedY * (index + 1) * 5}px)`,
          }}
          onMouseEnter={() => setCursorExpanded(true)}
          onMouseLeave={() => setCursorExpanded(false)}
        >
          <span className="block text-[0.5rem] tracking-[0.4em] text-fog mb-2">
            {fragment.label}
          </span>
          <span className="block text-xs tracking-[0.2em] text-mist leading-relaxed whitespace-pre-line">
            {fragment.value}
          </span>
        </div>
      ))}
    </div>
  )
}
