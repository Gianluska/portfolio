import { useState, useEffect, useCallback } from 'react'
import { NAV_SECTIONS } from '../lib/constants'

interface ScrollProgressData {
  progress: number // 0-100
  currentSection: string
  sectionIndex: number
}

export function useScrollProgress(): ScrollProgressData {
  const [data, setData] = useState<ScrollProgressData>({
    progress: 0,
    currentSection: NAV_SECTIONS[0].id,
    sectionIndex: 0,
  })

  const handleScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollTop = window.scrollY
    const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0

    // Determine current section based on scroll position
    const sectionElements = NAV_SECTIONS.map((section) =>
      document.getElementById(section.id)
    ).filter(Boolean) as HTMLElement[]

    let currentSection = NAV_SECTIONS[0].id
    let sectionIndex = 0

    for (let i = 0; i < sectionElements.length; i++) {
      const element = sectionElements[i]
      const rect = element.getBoundingClientRect()

      if (rect.top <= 300) {
        currentSection = NAV_SECTIONS[i].id
        sectionIndex = i
      }
    }

    setData({ progress, currentSection, sectionIndex })
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return data
}

// Hook for use within R3F ScrollControls context
export function useSectionFromOffset(offset: number): {
  currentSection: string
  sectionIndex: number
} {
  const totalSections = NAV_SECTIONS.length
  const sectionIndex = Math.min(
    Math.floor(offset * totalSections),
    totalSections - 1
  )

  return {
    currentSection: NAV_SECTIONS[sectionIndex].id,
    sectionIndex,
  }
}
