# Portfolio — estado da implementação

Escopo: abertura ASCII, amanhecer 1-bit no campo e subida pelas camadas da atmosfera até o espaço. Direção em `DESIGN.md`.

## Sequência

1. Aguardar a fonte monoespaçada local para evitar mudança de métrica.
2. Sortear e executar uma única vez um dos 37 efeitos do tte.js, por 1 a 2,75 s, até a logo oficial.
3. Manter a logo completa por 0,25 s antes da transição.
4. Apagar o loader e destruir seu Canvas temporário.
5. Mostrar o campo escuro após a abertura. Fazer o sol subir pelo horizonte e iluminar o céu e o solo antes de revelar o hero.
6. Manter o vento em rajadas e usar a posição horizontal do mouse para revelar a profundidade da cena.
7. Ao cruzar o limiar do scroll, manter o sol fixo enquanto a câmera sobe pelo campo, nuvens e estratosfera. No sentido oposto, refazer o percurso de volta.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Loader, Canvas e seções do campo e do espaço |
| `src/director.ts` | Sequência da abertura e gatilhos da cena e do hero |
| `src/components/FieldScene.ts` | Relógio, movimento da câmera, redimensionamento e pausa |
| `src/components/DawnLandscape.ts` | Céu, sol, composição do vale e avanço da luz |
| `src/components/UpperAtmosphere.ts` | Estrelas pulsantes, correntes e curvatura da atmosfera em cache |
| `src/components/EarthSurface.ts` | Superfície da Terra sob o contorno fixo, girada pelo mouse |
| `src/components/SceneScroll.ts` | Limiares da rolagem nativa, controles e foco das seções |
| `src/components/ValleyBackdrop.ts` | Três cristas de vale com mata, araucárias e árvores |
| `src/components/WindMeadow.ts` | Silhuetas de grama e rajadas na borda do horizonte |
| `src/components/CanvasPalette.ts` | Quantização 1-bit com orçamento fixo de pixels |
| `src/lib/env.ts` | Movimento reduzido e opção de pular a intro |
| `src/tailwind.css` | Entrada do Tailwind, fontes, tema e animações |
| `src/types/tte-js.d.ts` | Tipos da API tte.js utilizada na abertura |
| `scripts/build-glyphs.ts` | Geração das variantes FIGlet por letra |

Removidos: mar, gota, barco interativo e suas simulações.

## Uso

- `pnpm dev`: desenvolvimento.
- `pnpm build`: TypeScript e build de produção.
- `pnpm preview`: produção local.
- `?intro=0`: campo iluminado e hero, sem abertura ou nascer do sol.
- `prefers-reduced-motion`: logo e cenas estáticas, com troca direta entre campo e espaço.

A capa independente de GitHub em `github-profile/` não faz parte da cena.
