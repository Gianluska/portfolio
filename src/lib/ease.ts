import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

// Curvas desenhadas por trecho. Nenhuma animação do site usa os eases padrão.
// bloom: abre devagar, dispara no meio e desacelera por muito tempo.
CustomEase.create('bloom', 'M0,0 C0.3,0 0.22,0.62 0.42,0.82 0.6,0.99 0.8,1 1,1')

export { gsap }
