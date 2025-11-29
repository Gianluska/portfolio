import { BLOG_POSTS } from '../../lib/constants'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  setCursorExpanded: (expanded: boolean) => void
}

export function BlogSection() {
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)

  return (
    <section
      id="blog"
      className="min-h-screen flex items-center justify-center relative p-16"
    >
      <span className="section-label">// STREAM.DATA</span>

      <div className="w-full max-w-[800px]">
        <div className="flex flex-col">
          {BLOG_POSTS.map((post, index) => (
            <div
              key={index}
              className="stream-item max-md:grid-cols-1 max-md:gap-2"
              onMouseEnter={() => setCursorExpanded(true)}
              onMouseLeave={() => setCursorExpanded(false)}
            >
              <span className="text-[0.6rem] tracking-[0.2em] text-fog font-tabular">
                {post.date}
              </span>
              <span className="text-sm tracking-[0.1em] font-thin">
                {post.title}
              </span>
              <span className="text-base text-fog opacity-0 -translate-x-2.5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                →
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
