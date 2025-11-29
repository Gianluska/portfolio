import { useEffect, useRef } from 'react'
import { useMousePosition } from '../../hooks'
import { useAppStore } from '../../stores/useAppStore'

interface AppState {
  cursorExpanded: boolean
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const { x, y } = useMousePosition({ lerp: 0.15 })
  const cursorExpanded = useAppStore((state: AppState) => state.cursorExpanded)

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.left = `${x - 10}px`
      cursorRef.current.style.top = `${y - 10}px`
    }
  }, [x, y])

  return (
    <div
      ref={cursorRef}
      className={`cursor-custom ${cursorExpanded ? 'expand' : ''}`}
    />
  )
}
