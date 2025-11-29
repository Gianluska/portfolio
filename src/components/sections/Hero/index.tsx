import { LVSKTitle } from './LVSKTitle'
import { InfoFragments } from './InfoFragments'

export function HeroSection() {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative p-16"
    >
      <div className="w-full h-screen flex items-center justify-center relative overflow-hidden">
        <LVSKTitle />
        <InfoFragments />

        {/* Vertical text */}
        <div className="absolute left-16 top-1/2 -translate-y-1/2 rotate-180 text-[0.6rem] tracking-[0.5em] text-fog writing-vertical max-md:hidden">
          CREATIVE DEVELOPER
        </div>
        <div className="absolute right-16 top-1/2 -translate-y-1/2 text-[0.6rem] tracking-[0.5em] text-fog writing-vertical max-md:hidden">
          HYPER VISUAL WEB
        </div>
      </div>
    </section>
  )
}
