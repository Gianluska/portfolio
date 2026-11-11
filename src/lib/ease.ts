import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

// Curvas desenhadas por trecho. Nenhuma animação do site usa os eases padrão.
// rise: sai rápido, passa ~3% do alvo e assenta. Para texto que sobe por máscara.
CustomEase.create('rise', 'M0,0 C0.12,0.72 0.2,1.04 0.44,1.03 0.66,1.02 0.78,1 1,1')
// shoot: um feixe de luz. Acelera quase de imediato e chega seco.
CustomEase.create('shoot', 'M0,0 C0.5,0.02 0.42,0.9 0.7,0.97 0.82,0.995 0.92,1 1,1')
// bloom: abre devagar, dispara no meio e desacelera por muito tempo.
CustomEase.create('bloom', 'M0,0 C0.3,0 0.22,0.62 0.42,0.82 0.6,0.99 0.8,1 1,1')
// settle: entrada pesada com um recuo pequeno no fim.
CustomEase.create('settle', 'M0,0 C0.2,0.9 0.32,1.08 0.52,1.05 0.72,1.02 0.84,1 1,1')

export { gsap }
