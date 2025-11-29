import { useTime } from '../../hooks'

export function TimeDisplay() {
  const { time, date } = useTime()

  return (
    <div className="fixed top-8 right-8 text-[0.65rem] tracking-[0.3em] text-fog z-[200] text-right">
      <div>{time}</div>
      <div>{date}</div>
    </div>
  )
}
