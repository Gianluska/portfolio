import { useState, useEffect, useCallback, useRef } from 'react'
import type { MousePosition } from '../types'

interface UseMousePositionOptions {
  lerp?: number
  enabled?: boolean
}

interface UseMousePositionReturn extends MousePosition {
  targetX: number
  targetY: number
}

export function useMousePosition(
  options: UseMousePositionOptions = {}
): UseMousePositionReturn {
  const { lerp = 0.15, enabled = true } = options

  const [position, setPosition] = useState<UseMousePositionReturn>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
    targetX: 0,
    targetY: 0,
  })

  const currentRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  const updatePosition = useCallback(() => {
    // Lerp towards target
    currentRef.current.x +=
      (targetRef.current.x - currentRef.current.x) * lerp
    currentRef.current.y +=
      (targetRef.current.y - currentRef.current.y) * lerp

    // Calculate normalized values (-1 to 1)
    const normalizedX =
      (targetRef.current.x / window.innerWidth) * 2 - 1
    const normalizedY =
      -(targetRef.current.y / window.innerHeight) * 2 + 1

    setPosition({
      x: currentRef.current.x,
      y: currentRef.current.y,
      normalizedX,
      normalizedY,
      targetX: targetRef.current.x,
      targetY: targetRef.current.y,
    })

    rafRef.current = requestAnimationFrame(updatePosition)
  }, [lerp])

  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX
      targetRef.current.y = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove)
    rafRef.current = requestAnimationFrame(updatePosition)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [enabled, updatePosition])

  return position
}
