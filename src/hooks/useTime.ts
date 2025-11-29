import { useState, useEffect } from 'react'

interface TimeData {
  time: string // HH:MM:SS
  date: string // YYYY.MM.DD
}

export function useTime(updateInterval = 1000): TimeData {
  const [timeData, setTimeData] = useState<TimeData>(() => formatTime(new Date()))

  useEffect(() => {
    const updateTime = () => {
      setTimeData(formatTime(new Date()))
    }

    const intervalId = setInterval(updateTime, updateInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [updateInterval])

  return timeData
}

function formatTime(date: Date): TimeData {
  const time = date.toTimeString().split(' ')[0] // HH:MM:SS
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '.') // YYYY.MM.DD

  return { time, date: dateStr }
}
