import { useEffect, useRef, useState } from 'react'
import { EMAIL, SOCIAL_LINKS } from '../data/identity.js'

export default function Contact({ onActiveChange }) {
  const [copyState, setCopyState] = useState('idle')
  const resetTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function copyEmail() {
    window.clearTimeout(resetTimer.current)

    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }

    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 4000)
  }

  return (
    <section className="contact" id="contact" aria-labelledby="contact-heading">
      <div className="contact-inner">
        <h2 id="contact-heading">Have something<br />in mind?</h2>
        <div
          className="contact-connection"
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') onActiveChange(true)
          }}
          onPointerLeave={() => onActiveChange(false)}
          onFocus={() => onActiveChange(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) onActiveChange(false)
          }}
        >
          <a className="contact-address" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <div className="contact-actions">
            <a href={`mailto:${EMAIL}`}>Email me</a>
            <button className="copy-email" type="button" onClick={copyEmail}>
              {copyState === 'copied' ? 'Copied' : 'Copy email'}
            </button>
          </div>
          <p className="copy-status" role="status" aria-live="polite">
            {copyState === 'copied' && 'Email address copied.'}
            {copyState === 'error' && 'Could not copy. Select the address above to copy it.'}
          </p>
        </div>
      </div>

      <footer className="site-footer">
        <a className="footer-signature" href="#hero" aria-label="lvsk. back to top">lvsk.</a>
        <div className="footer-links">
          {SOCIAL_LINKS.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
      </footer>
    </section>
  )
}
