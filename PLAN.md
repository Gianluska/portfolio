# Portfolio — estado da implementação

Escopo: abertura ASCII, cabeçalho e impacto que revela um rio ASCII animado sobre fundo preto. Direção em `DESIGN.md`.

## Sequência

1. Aguardar a fonte monoespaçada local para evitar mudança de métrica.
2. Sortear um dos 37 efeitos do tte.js e sua duração, entre 1 e 5 s, a cada carregamento. Executá-lo uma vez em tons de cinza até a logo ASCII oficial.
3. Manter a logo completa por 0,25 s antes da transição.
4. Apagar o loader, destruir o Canvas da abertura e revelar o cabeçalho, preservando impressão da logo e entrada dos links.
5. Uma gota ASCII cai no centro durante 0,95 s, com o cabeçalho preservado.
6. O impacto gera um respingo e uma onda circular que revela o canal ao longo de 1,85 s.
7. A onda desaparece; a correnteza continua em um Canvas 2D, com a área fora do rio em #000000.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Loader, Canvas do rio e markup do cabeçalho |
| `src/director.ts` | Sequência da abertura, início do rio e eventos da logo do cabeçalho |
| `src/components/AsciiLogo.ts` | Logo do cabeçalho e onda de variantes no hover/foco |
| `src/components/AsciiRiver.ts` | Queda, impacto, revelação radial, correnteza e ciclo de vida do Canvas |
| `src/components/NavLink.ts` | Scramble, sublinhado e atração magnética |
| `src/lib/spring.ts` | Mola dos links |
| `src/lib/env.ts` | Movimento reduzido e opção de pular a intro |
| `src/style.css` | Camadas do loader, rio e cabeçalho |
| `src/types/tte-js.d.ts` | Tipos da API tte.js utilizada na abertura |
| `scripts/build-glyphs.ts` | Geração das variantes FIGlet por letra |

Removidos: hero, funções profissionais em ciclo, cena R3F/Three.js, baralho, shaders, loop de render 3D, depuração da cena e controle de ponteiro 3D.

## Uso

- `npm run dev`: desenvolvimento.
- `npm run build`: TypeScript e build de produção.
- `npm run preview`: produção local.
- `?intro=0`: cabeçalho e rio direto, sem abertura, gota ou onda.
- `prefers-reduced-motion`: fonte oficial estática durante a abertura, cabeçalho sem coreografia e rio estático.

Projects e Contact continuam mocks. A capa independente de GitHub em `github-profile/` permanece fora desta alteração.
