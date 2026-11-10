import { useSyncExternalStore } from 'react'

const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
const getSnapshot = () => preference.matches
const getServerSnapshot = () => true

function subscribe(onChange) {
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
