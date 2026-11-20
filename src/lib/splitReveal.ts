// Splits a reveal block's text into word spans so each word can enter on its own beat.
const DISPLAY = 'h2, h3'
// Stagger (ms) between words: display type steps slowly, body copy ripples.
const DISPLAY_STEP = 70
const BODY_STEP = 9
const LINK_STEP = 90
// Longest entrance a word can run after its delay (ms), plus the largest block offset (--reveal-delay),
// used to know when the block has settled.
const LONGEST = 1500

/** Wraps every word under `block` and returns how long (ms) the whole entrance takes. */
export function splitReveal(block: HTMLElement): number {
  if (block.dataset.split) return Number(block.dataset.split)
  let delay = 0
  let hue = 0
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  const texts: Text[] = []
  while (walker.nextNode()) texts.push(walker.currentNode as Text)
  const links = new Set<Element>()

  for (const text of texts) {
    const parent = text.parentElement
    if (!parent || !text.data.trim()) continue
    const display = Boolean(parent.closest(DISPLAY))
    const link = parent.closest('.portfolio__link')
    if (link && !links.has(link)) {
      links.add(link)
      ;(link as HTMLElement).style.setProperty('--d', `${delay}ms`)
      delay += LINK_STEP
    }
    // One inline run per text node: inside flex parents (links) the words stay a single item.
    const run = document.createElement('span')
    run.className = 'rv-run'
    for (const part of text.data.split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) {
        run.append(part)
        continue
      }
      const word = document.createElement('span')
      word.className = display ? 'rv-display' : 'rv-word'
      word.textContent = part
      word.style.setProperty('--d', `${delay}ms`)
      word.style.setProperty('--hue', `var(--s${hue++ % 6})`)
      delay += display ? DISPLAY_STEP : BODY_STEP
      if (display) {
        const mask = document.createElement('span')
        mask.className = 'rv-mask'
        mask.append(word)
        run.append(mask)
      } else run.append(word)
    }
    text.replaceWith(run)
  }

  const total = delay + LONGEST
  block.dataset.split = String(total)
  return total
}
