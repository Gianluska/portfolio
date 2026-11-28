import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

// Curvas desenhadas por trecho. Nenhuma animação do site usa os eases padrão.
// bloom: abre devagar, dispara no meio e desacelera por muito tempo.
CustomEase.create('bloom', 'M0,0 C0.3,0 0.22,0.62 0.42,0.82 0.6,0.99 0.8,1 1,1')

// Preserve the cloud crossing, then brake into one small overshoot before settling.
export const flightEase = CustomEase.create('flight',
  'M0,0 C0.16,0 0.32,0.24 0.5,0.52 C0.64,0.738 0.71,0.995 0.83,1.008 C0.88,1.0134 0.93,1 1,1')

// The planet gathers speed, carries the next item a little past the sun and settles back.
CustomEase.create('orbit', 'M0,0 C0.2,0 0.3,0.6 0.5,0.86 0.64,1.04 0.78,1.024 1,1')

// The same curve as the sunrise: fastest in the first third, then a long approach to rest.
export const riseEase = (p: number): number => 1 - (1 - p) ** 3 * (1 + 3 * p)

// Lifts slightly before sinking, as if the title lets go of the sky.
export const setEase = (p: number): number => p * p * (2.3 * p - 1.3)

export { gsap }
