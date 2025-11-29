import { useFPS } from '../../hooks'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  scrollProgress: number
}

export function StatusBar() {
  const fps = useFPS()
  const scrollProgress = useAppStore((state: AppState) => state.scrollProgress)

  return (
    <div className="status-bar">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-fog animate-[pulse_2s_infinite]" />
        <span>SYSTEM ACTIVE</span>
      </div>
      <div className="flex items-center gap-2">
        <span>SCROLL: {scrollProgress}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span>FPS: {fps}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>&copy; 2024 LVSK.SYS</span>
      </div>
    </div>
  )
}
