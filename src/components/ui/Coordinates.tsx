import { useMousePosition } from '../../hooks'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  scrollOffset: number
}

export function Coordinates() {
  const { normalizedX, normalizedY } = useMousePosition()
  const scrollOffset = useAppStore((state: AppState) => state.scrollOffset)

  return (
    <div className="fixed top-8 left-8 text-[0.65rem] tracking-[0.3em] text-fog z-[200] font-tabular">
      <div>X: {normalizedX.toFixed(3)}</div>
      <div>Y: {normalizedY.toFixed(3)}</div>
      <div>Z: {(scrollOffset % 1).toFixed(3)}</div>
    </div>
  )
}
