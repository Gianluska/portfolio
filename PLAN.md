# Portfolio — estado da implementação

Escopo: abertura ASCII e cabeçalho sobre fundo preto. Direção em `DESIGN.md`.

## Sequência

1. Aguardar a fonte monoespaçada local para evitar mudança de métrica.
2. Mostrar a logo central; cada letra troca de fonte por pelo menos 2 s.
3. Resolver de l para k na fonte Shadow e aguardar 0,25 s. Ciclo completo de aproximadamente 3 s.
4. Apagar o loader e revelar o cabeçalho, preservando impressão da logo e entrada dos links.
5. Manter somente o cabeçalho e fundo #000000. O grão do loader também desaparece.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Loader e markup do cabeçalho |
| `src/director.ts` | Sequência da abertura e eventos da logo do cabeçalho |
| `src/components/AsciiLogo.ts` | Ciclo e resolução dos glifos em células fixas |
| `src/components/NavLink.ts` | Scramble, sublinhado e atração magnética |
| `src/lib/spring.ts` | Mola dos links |
| `src/lib/env.ts` | Movimento reduzido e opção de pular a intro |
| `src/style.css` | Estilos apenas do loader e cabeçalho |
| `scripts/build-glyphs.ts` | Geração das variantes FIGlet por letra |

Removidos: hero, funções profissionais em ciclo, cena R3F/Three.js, baralho, shaders, loop de render, depuração da cena e controle de ponteiro 3D.

## Uso

- `npm run dev`: desenvolvimento.
- `npm run build`: TypeScript e build de produção.
- `npm run preview`: produção local.
- `?intro=0`: cabeçalho direto, sem abertura.
- `prefers-reduced-motion`: fonte oficial estática durante a abertura e cabeçalho sem coreografia.

Projects e Contact continuam mocks. A capa independente de GitHub em `github-profile/` permanece fora desta alteração.
