# Portfolio — estado da implementação

Escopo: abertura ASCII e cena noturna de uma tela, com perspectiva frontal fixa. Direção em `DESIGN.md`.

## Sequência

1. Aguardar a fonte monoespaçada local para evitar mudança de métrica.
2. Sortear e executar uma única vez um dos 37 efeitos do tte.js, por 1 a 2,75 s, até a logo oficial.
3. Manter a logo completa por 0,25 s antes da transição.
4. Apagar o loader e destruir seu Canvas temporário.
5. Revelar a cena com a queda da gota e a onda de impacto.
6. Manter horizonte nivelado a 72% da tela, lua central e reflexo em faixas no mar. O navio começa de perfil no horizonte e responde ao ponteiro sobre a água. Não há scroll.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Loader, Canvas e hero tipográfico |
| `src/director.ts` | Sequência da abertura e gatilhos da cena e do hero |
| `src/components/AsciiRiver.ts` | Gota, impacto, grade de água e ciclo de vida |
| `src/components/AsciiPerspective.ts` | Horizonte fixo, projeção inversa e profundidade |
| `src/components/MoonlitBackdrop.ts` | Céu procedural em cache e reflexo lunar |
| `src/components/AsciiAtmosphere.ts` | Navio, brisas, bandos e partículas no mesmo relógio |
| `src/components/RiverPalette.ts` | Quantização 1-bit com orçamento fixo de pixels |
| `src/lib/env.ts` | Movimento reduzido e opção de pular a intro |
| `src/tailwind.css` | Entrada do Tailwind, fontes, tema e animações |
| `src/types/tte-js.d.ts` | Tipos da API tte.js utilizada na abertura |
| `scripts/build-glyphs.ts` | Geração das variantes FIGlet por letra |

Removidos: cachoeira, indicador, câmera por scroll e tela final vazia.

## Uso

- `pnpm dev`: desenvolvimento.
- `pnpm build`: TypeScript e build de produção.
- `pnpm preview`: produção local.
- `?intro=0`: cena e hero diretos, sem abertura, gota ou onda.
- `prefers-reduced-motion`: logo, céu, mar, reflexo e navio estáticos.

A capa independente de GitHub em `github-profile/` não faz parte da cena.
