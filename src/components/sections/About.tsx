import { ABOUT_CELLS } from '../../lib/constants'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  setCursorExpanded: (expanded: boolean) => void
}

export function AboutSection() {
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)

  return (
    <section
      id="about"
      className="min-h-screen flex items-center justify-center relative p-16"
    >
      <span className="section-label">// DATA.PROFILE</span>

      <div className="w-full max-w-[1200px]">
        <div
          className="grid gap-0.5 max-lg:grid-cols-4 max-md:grid-cols-2"
          style={{
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(6, 80px)',
          }}
        >
          {ABOUT_CELLS.map((cell, index) => (
            <div
              key={index}
              className={`about-cell ${cell.type === 'highlight' ? 'highlight' : ''}`}
              style={{
                gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined,
                gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined,
              }}
              onMouseEnter={() => setCursorExpanded(true)}
              onMouseLeave={() => setCursorExpanded(false)}
            >
              {cell.type === 'stat' && (
                <div>
                  <div className="text-[0.5rem] tracking-[0.3em] text-fog">
                    {cell.label}
                  </div>
                  <div className="text-4xl font-thin">{cell.value}</div>
                </div>
              )}

              {cell.type === 'text' && (
                <div className="text-[0.65rem] tracking-[0.2em] leading-relaxed text-mist whitespace-pre-line">
                  {cell.text}
                </div>
              )}

              {cell.type === 'highlight' && cell.text && (
                <div className="text-[0.65rem] tracking-[0.2em] leading-relaxed whitespace-pre-line">
                  {cell.text}
                </div>
              )}

              {cell.type === 'highlight' && cell.value && (
                <div>
                  <div className="text-[0.5rem] tracking-[0.3em]">
                    {cell.label}
                  </div>
                  <div className="text-4xl font-thin">{cell.value}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
