import type { DeckRig } from './DeckRig'
import type { PerspectiveCamera, WebGLRenderer } from 'three'

export const FOV = 35
export const CAM_Z = 10
const PIXEL_BUDGET = 3.6e6

/** Geometria da tela vista pela câmera: tudo que os rigs precisam para se posicionar. */
export interface View {
  w: number
  h: number
  dpr: number
  aspect: number
  /** tan(fov / 2) */
  tan: number
  camZ: number
  /** Metade da altura/largura visível em z = 0. */
  halfH: number
  halfW: number
  /** Pixels CSS por unidade de mundo em z = 0. */
  pxPerUnit: number
  portrait: boolean
}

export function computeView(w: number, h: number, dpr: number): View {
  const tan = Math.tan((FOV * Math.PI) / 360)
  const aspect = w / h
  return {
    w,
    h,
    dpr,
    aspect,
    tan,
    camZ: CAM_Z,
    halfH: CAM_Z * tan,
    halfW: CAM_Z * tan * aspect,
    pxPerUnit: h / (2 * CAM_Z * tan),
    portrait: aspect < 0.85,
  }
}

/** DPR alvo: limitado a 2 e a um orçamento de pixels, multiplicado pela qualidade atual. */
export function targetDpr(w: number, h: number, quality: number): number {
  return Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (w * h))) * quality
}

/**
 * Estado compartilhado entre a cena R3F e o diretor da intro.
 * É mutável de propósito: é lido e escrito a cada frame, fora do ciclo de render do React.
 */
export interface Stage {
  view: View
  /** Relógio da cena (s). */
  time: number
  /** Tempo do fechamento do baralho (s). */
  closeT: number
  /** 0..1: quanto a câmera acompanha o ponteiro. */
  parallax: number
  /** O baralho reage sutilmente ao ponteiro. */
  interactive: boolean
  fps: number
  quality: number
  deck: DeckRig
  renderer: WebGLRenderer
  camera: PerspectiveCamera
  /** Antes da atualização dos rigs, a cada frame. */
  onFrame?: (dt: number, time: number) => void
  /** Depois do render, a cada frame. */
  onRendered?: (dt: number, time: number) => void
}
