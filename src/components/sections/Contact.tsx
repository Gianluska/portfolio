import { CONTACT_LINKS, CONTACT_EMAIL } from '../../lib/constants'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  setCursorExpanded: (expanded: boolean) => void
}

export function ContactSection() {
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)

  return (
    <section
      id="contact"
      className="min-h-screen flex items-center justify-center relative p-16"
    >
      <span className="section-label">// SIGNAL.CONNECT</span>

      <div className="text-center">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-clamp-contact font-thin tracking-[0.2em] text-mist no-underline inline-block p-8 border border-transparent transition-all duration-300 hover:text-pure hover:border-pure"
          onMouseEnter={() => setCursorExpanded(true)}
          onMouseLeave={() => setCursorExpanded(false)}
        >
          {CONTACT_EMAIL.toUpperCase()}
        </a>

        <div className="flex justify-center gap-16 mt-16">
          {CONTACT_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[0.6rem] tracking-[0.4em] text-fog no-underline p-2 transition-colors duration-300 hover:text-pure"
              onMouseEnter={() => setCursorExpanded(true)}
              onMouseLeave={() => setCursorExpanded(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
