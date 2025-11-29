import { useState, useCallback } from 'react'
import { EXPERIMENTS } from '../../lib/constants'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  setCursorExpanded: (expanded: boolean) => void
}

export function LabSection() {
  const [clickedCommand, setClickedCommand] = useState<number | null>(null)
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)

  const handleCommandClick = useCallback((index: number) => {
    setClickedCommand(index)
    setTimeout(() => setClickedCommand(null), 200)
  }, [])

  return (
    <section
      id="lab"
      className="min-h-screen flex items-center justify-center relative p-16"
    >
      <span className="section-label">// LAB.TERMINAL</span>

      <div className="w-full max-w-[900px]">
        <div className="terminal">
          <div className="terminal-header">
            <span className="tracking-[0.3em] text-fog">EXPERIMENTS.SH</span>
            <div className="flex gap-2">
              <div className="terminal-dot" />
              <div className="terminal-dot" />
              <div className="terminal-dot" />
            </div>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {EXPERIMENTS.map((experiment, index) => (
              <div
                key={index}
                className="flex mb-3 opacity-0 animate-[terminalFade_0.5s_ease_forwards]"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <span className="text-fog mr-4 select-none">$</span>
                <span
                  className="text-mist cursor-pointer relative transition-colors duration-200 hover:text-pure"
                  style={{ color: clickedCommand === index ? 'var(--color-pure)' : undefined }}
                  onClick={() => handleCommandClick(index)}
                  onMouseEnter={() => setCursorExpanded(true)}
                  onMouseLeave={() => setCursorExpanded(false)}
                >
                  {experiment.command}
                  <span className="absolute -right-8 opacity-0 transition-all duration-200 hover:opacity-100 hover:-right-10">
                    →
                  </span>
                </span>
              </div>
            ))}

            {/* Blinking cursor line */}
            <div
              className="flex mb-3 opacity-0 animate-[terminalFade_0.5s_ease_forwards]"
              style={{ animationDelay: `${(EXPERIMENTS.length + 1) * 0.1}s` }}
            >
              <span className="text-fog mr-4 select-none">$</span>
              <span className="text-fog italic">
                _
                <span className="inline-block w-2 h-3.5 bg-mist ml-1 animate-[blink_1s_step-end_infinite]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
