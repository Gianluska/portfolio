export function GlitchLayer() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9997] bg-pure animate-[glitchFlash_8s_infinite]"
      style={{ opacity: 0 }}
      aria-hidden="true"
    />
  )
}
