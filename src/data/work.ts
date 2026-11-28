/** Placeholder experience: every company, period and link below is fictional. */
export interface WorkItem {
  /** Company name, shown on the limb and as the rising title. */
  name: string
  period: string
  role: string
  summary: string
  stack: string[]
  link: { label: string, href: string }
  /** Horizontal position of each annotation star, 0–1 across the sky, from the top row down. */
  chart: [number, number, number, number, number]
}

export const work: WorkItem[] = [
  {
    name: 'Halcyon',
    period: '2024 — now',
    role: 'Lead frontend engineer',
    summary: 'Leads the interface team behind a live mapping platform for coastal research crews.',
    stack: ['React', 'WebGL', 'Rust'],
    link: { label: 'Company', href: '#halcyon' },
    chart: [0.22, 0.68, 0.18, 0.80, 0.30],
  },
  {
    name: 'Meridian',
    period: '2022 — 2024',
    role: 'Product engineer',
    summary: 'Built the treasury dashboard and the design system shared by four product squads.',
    stack: ['TypeScript', 'Node', 'Postgres'],
    link: { label: 'Company', href: '#meridian' },
    chart: [0.74, 0.26, 0.82, 0.20, 0.70],
  },
  {
    name: 'Kestrel Studio',
    period: '2020 — 2022',
    role: 'Creative technologist',
    summary: 'Prototyped generative identities and interactive installations for cultural clients.',
    stack: ['Canvas', 'GLSL', 'Figma'],
    link: { label: 'Company', href: '#kestrel-studio' },
    chart: [0.16, 0.36, 0.76, 0.24, 0.84],
  },
  {
    name: 'Saltmarsh',
    period: '2019 — 2020',
    role: 'Frontend specialist',
    summary: 'Rebuilt the streaming player and cut its load time in half across low-end devices.',
    stack: ['Svelte', 'Web Audio', 'Go'],
    link: { label: 'Company', href: '#saltmarsh' },
    chart: [0.80, 0.62, 0.20, 0.72, 0.28],
  },
  {
    name: 'Northwind',
    period: '2017 — 2019',
    role: 'Frontend developer',
    summary: 'Shipped launches and microsites for a small agency, from first sketch to production.',
    stack: ['Vue', 'GSAP', 'PHP'],
    link: { label: 'Company', href: '#northwind' },
    chart: [0.70, 0.20, 0.30, 0.84, 0.62],
  },
]
