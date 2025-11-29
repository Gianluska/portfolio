import { PROJECTS } from '../../lib/constants'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  setCursorExpanded: (expanded: boolean) => void
}

export function ProjectsSection() {
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)

  return (
    <section
      id="projects"
      className="relative min-h-screen flex flex-col justify-center py-32 px-16"
    >
      <span className="section-label">// WORKS.DATABASE</span>

      <div className="relative w-full max-w-[1200px] mx-auto">
        {/* Connection lines SVG */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-50">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M 10,10 L 90,25 L 10,45 L 90,65 L 10,85"
              stroke="var(--color-ash)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="8, 12"
              className="animate-[dashMove_20s_linear_infinite]"
            />
          </svg>
        </div>

        {PROJECTS.map((project, index) => (
          <div
            key={project.index}
            className={`project-node ${
              index % 2 === 0
                ? 'justify-start pl-[5%] max-lg:pl-0'
                : 'justify-end pr-[5%] max-lg:pr-0 max-lg:justify-start'
            }`}
            onMouseEnter={() => setCursorExpanded(true)}
            onMouseLeave={() => setCursorExpanded(false)}
          >
            <div className="project-index">{project.index}</div>
            <div
              className={`project-info ${
                index % 2 === 1 ? 'order-[-1] text-right pr-8 pl-0 max-lg:order-1 max-lg:text-left max-lg:pr-0 max-lg:pl-8' : ''
              }`}
            >
              <div className="text-2xl font-thin tracking-[0.3em] mb-2">
                {project.title}
              </div>
              <div className="text-[0.6rem] tracking-[0.3em] text-fog">
                {project.meta} — {project.year}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
