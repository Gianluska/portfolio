import { useEffect } from 'react'
import { BOOT_MESSAGES, ANIMATION_DURATIONS } from '../../lib/constants'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  bootComplete: boolean
  setBootComplete: (complete: boolean) => void
}

export function BootSequence() {
  const bootComplete = useAppStore((state: AppState) => state.bootComplete)
  const setBootComplete = useAppStore((state: AppState) => state.setBootComplete)

  useEffect(() => {
    // bootSequence (3.5s delay) + bootFade (4s duration) = 7.5s total
    const timer = setTimeout(() => {
      setBootComplete(true)
    }, ANIMATION_DURATIONS.bootSequence + ANIMATION_DURATIONS.bootFade)

    return () => clearTimeout(timer)
  }, [setBootComplete])

  if (bootComplete) return null

  return (
    <div
      className="fixed inset-0 bg-void z-[10000] flex items-center justify-center flex-col animate-[bootFade_4s_ease_forwards_3.5s]"
    >
      {BOOT_MESSAGES.map((message, index) => (
        <div
          key={index}
          className="text-xs tracking-[0.5em] overflow-hidden whitespace-nowrap w-0 animate-[bootType_0.5s_steps(20)_forwards]"
          style={{
            animationDelay: `${index * 0.6}s`,
            color: index === BOOT_MESSAGES.length - 1 ? 'var(--color-pure)' : 'var(--color-fog)',
          }}
        >
          {message}
        </div>
      ))}
    </div>
  )
}
