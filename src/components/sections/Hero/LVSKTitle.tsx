import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '../../../stores/useAppStore'
import { GLITCH_CHARS } from '../../../lib/constants'

interface AppState {
  setCursorExpanded: (expanded: boolean) => void
}

const LETTERS = ['L', 'V', 'S', 'K']

interface LetterProps {
  letter: string
}

function Letter({ letter }: LetterProps) {
  const [displayLetter, setDisplayLetter] = useState(letter)
  const [isHovered, setIsHovered] = useState(false)
  const setCursorExpanded = useAppStore((state: AppState) => state.setCursorExpanded)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    setCursorExpanded(true)

    let iterations = 0
    intervalRef.current = setInterval(() => {
      setDisplayLetter(
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      )
      iterations++

      if (iterations > 8) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        setDisplayLetter(letter)
      }
    }, 40)
  }, [letter, setCursorExpanded])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setCursorExpanded(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setDisplayLetter(letter)
  }, [letter, setCursorExpanded])

  return (
    <div
      className="relative cursor-default transition-transform duration-300 ease-out hover:scale-105 hover:z-20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main letter */}
      <span
        className="text-clamp-hero font-thin text-pure block leading-[0.85] relative z-[2] transition-all duration-300 max-md:text-clamp-hero-mobile"
        style={{
          textShadow: isHovered
            ? '0 0 60px rgba(255, 255, 255, 0.5), 0 0 120px rgba(255, 255, 255, 0.2)'
            : 'none',
        }}
      >
        {displayLetter}
      </span>

      {/* Ghost letters */}
      <span
        className="absolute top-0 left-0 text-clamp-hero font-thin leading-[0.85] text-stroke-ash opacity-30 transition-all duration-500 max-md:text-clamp-hero-mobile"
        style={{
          transform: isHovered ? 'translate(-15px, -15px)' : 'translate(-5px, -5px)',
          opacity: isHovered ? 0.5 : 0.3,
        }}
      >
        {letter}
      </span>
      <span
        className="absolute top-0 left-0 text-clamp-hero font-thin leading-[0.85] text-stroke-fog opacity-15 transition-all duration-500 max-md:text-clamp-hero-mobile"
        style={{
          transform: isHovered ? 'translate(15px, 15px)' : 'translate(5px, 5px)',
          opacity: isHovered ? 0.3 : 0.15,
        }}
      >
        {letter}
      </span>

      {/* Floating fragments on hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute text-2xl text-fog animate-[fragmentFloat_2s_infinite_ease-in-out]"
              style={{
                top: i === 0 ? '-20%' : i === 2 ? 'auto' : '30%',
                bottom: i === 2 ? '-20%' : 'auto',
                left: i === 0 ? '20%' : i === 2 ? '40%' : i === 3 ? '-30%' : 'auto',
                right: i === 1 ? '-30%' : 'auto',
                animationDelay: `${i * 0.3}s`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function LVSKTitle() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="flex gap-0 relative z-10">
        {LETTERS.map((letter) => (
          <Letter key={letter} letter={letter} />
        ))}
      </div>

      {/* Orbital rings */}
      <div
        className="absolute border border-ash rounded-full pointer-events-none opacity-30 animate-[orbitSpin_20s_linear_infinite]"
        style={{ width: '120%', height: '120%' }}
      />
      <div
        className="absolute border border-ash rounded-full pointer-events-none opacity-20 animate-[orbitSpin_30s_linear_infinite_reverse]"
        style={{ width: '140%', height: '80%', transform: 'rotateX(60deg)' }}
      />
      <div
        className="absolute border border-ash rounded-full pointer-events-none opacity-10 animate-[orbitSpin_40s_linear_infinite]"
        style={{ width: '160%', height: '100%', transform: 'rotateY(30deg) rotateX(20deg)' }}
      />

      {/* Scanning line */}
      <div
        className="absolute left-[-10%] w-[120%] h-0.5 opacity-60 animate-[scanMove_4s_ease-in-out_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--color-fog) 20%, var(--color-pure) 50%, var(--color-fog) 80%, transparent 100%)',
        }}
      />
    </div>
  )
}
