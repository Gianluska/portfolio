# Portfolio — estado da implementação

Escopo: abertura ASCII, cabeçalho e gota que revela água mais clara, vista de cima, com listras lentas e simultâneas de brisa em opacidades diferentes e bandos simultâneos em ASCII. Direção em `DESIGN.md`.

## Sequência

1. Aguardar a fonte monoespaçada local para evitar mudança de métrica.
2. Sortear um dos 37 efeitos do tte.js e sua duração, entre 1 e 5 s, a cada carregamento. Executá-lo uma vez em tons de cinza até a logo ASCII oficial.
3. Manter a logo completa por 0,25 s antes da transição.
4. Apagar o loader, destruir o Canvas da abertura e revelar o cabeçalho, preservando impressão da logo e entrada dos links.
5. Uma gota ASCII cai no centro durante 0,95 s, com o cabeçalho preservado.
6. O impacto gera uma onda radial na própria água: crista e depressão alteram normais, reflexos e posições dos glifos. A propagação em velocidade constante revela o mar atrás da onda em 2,8 s, até ultrapassar os cantos da tela, sem anéis sobrepostos.
7. Manter a água em tela cheia com câmera vertical ortográfica e escala uniforme, sem canal, margens ou compressão de perspectiva.
8. Dois swells e seis ondas de vento suaves formam um mar calmo: a altura escolhe `~`, `-` ou `.`, e a luz voltada ao sol define a opacidade, com brilhos raros. Listras de brisa longas atravessam a água em 12 s e a agitam, com uma nova a cada 1,25 s e até dez simultâneas. Cada passagem tem opacidade entre 0,14 e 0,34. Pássaros ASCII compactos voam sozinhos, em pares ou em setas triangulares de cinco, com grupos novos a cada 5,5 s e sobreposição de até três grupos.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Loader, Canvas do rio e markup do cabeçalho |
| `src/director.ts` | Sequência da abertura, início do rio e eventos da logo do cabeçalho |
| `src/components/AsciiLogo.ts` | Logo do cabeçalho e onda de variantes no hover/foco |
| `src/components/AsciiRiver.ts` | Gota e impacto preservados, água ortográfica, reflexos, soma dos campos de brisa e ciclo de vida |
| `src/components/AsciiAtmosphere.ts` | Coordena bandos e brisas no mesmo relógio e Canvas e compartilha os campos de vento |
| `src/components/AsciiBirdFlocks.ts` | Pássaros ASCII detalhados, solos, pares e setas de cinco; até três bandos simultâneos |
| `src/components/AsciiBreezes.ts` | Listras longas, lentas e simultâneas, opacidade por passagem e campos de pressão |
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
- `prefers-reduced-motion`: logo e água estáticas; sem coreografia, brisas ou pássaros.

Projects e Contact continuam mocks. A capa independente de GitHub em `github-profile/` permanece fora desta alteração.
