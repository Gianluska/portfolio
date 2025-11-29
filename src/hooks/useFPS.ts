import { useState, useEffect, useRef } from 'react'

export function useFPS(): number {
  const [fps, setFps] = useState(60)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const updateFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()

      if (currentTime - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current)
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }

      rafRef.current = requestAnimationFrame(updateFPS)
    }

    rafRef.current = requestAnimationFrame(updateFPS)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return fps
}
