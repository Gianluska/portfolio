# Portfolio — estado da implementação

Escopo: abertura ASCII e amanhecer com horizonte plano, grama só na borda e hero sobre o solo. Direção em `DESIGN.md`.

## Sequência

1. Aguardar a fonte monoespaçada local para evitar mudança de métrica.
2. Sortear e executar uma única vez um dos 37 efeitos do tte.js, por 1 a 2,75 s, até a logo oficial.
3. Manter a logo completa por 0,25 s antes da transição.
4. Apagar o loader e destruir seu Canvas temporário.
5. Mostrar o campo escuro após a abertura. Fazer o sol subir pelo horizonte e iluminar o céu e o solo antes de revelar o hero.
6. Manter o vento em rajadas que atravessam as touceiras. Não há scroll, barco ou movimento da câmera.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Loader, Canvas e hero tipográfico |
| `src/director.ts` | Sequência da abertura e gatilhos da cena e do hero |
| `src/components/FieldScene.ts` | Cronometragem, redimensionamento e pausa da cena |
| `src/components/DawnLandscape.ts` | Horizonte fixo, sol, nuvens e avanço da luz |
| `src/components/WindMeadow.ts` | Silhuetas de grama e rajadas na borda do horizonte |
| `src/components/CanvasPalette.ts` | Quantização 1-bit com orçamento fixo de pixels |
| `src/lib/env.ts` | Movimento reduzido e opção de pular a intro |
| `src/tailwind.css` | Entrada do Tailwind, fontes, tema e animações |
| `src/types/tte-js.d.ts` | Tipos da API tte.js utilizada na abertura |
| `scripts/build-glyphs.ts` | Geração das variantes FIGlet por letra |

Removidos: mar, gota, barco interativo e suas simulações. A página continua sem rolagem.

## Uso

- `pnpm dev`: desenvolvimento.
- `pnpm build`: TypeScript e build de produção.
- `pnpm preview`: produção local.
- `?intro=0`: campo iluminado e hero, sem abertura ou nascer do sol.
- `prefers-reduced-motion`: logo e campo estáticos, com o sol já alto.

A capa independente de GitHub em `github-profile/` não faz parte da cena.
