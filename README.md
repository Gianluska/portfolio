# Gianlucca Claudino — portfolio

Portfólio com abertura ASCII, cabeçalho e um rio procedural em caracteres sobre preto. Sem hero, baralho ou cena 3D.

## Experiência atual

- A cada carregamento, um dos 37 efeitos do tte.js é sorteado para revelar a logo ASCII oficial, com duração também aleatória entre 1 e 5 s. A abertura permanece monocromática, com pausa final de 0,25 s e sem repetição em loop.
- A abertura desaparece e o cabeçalho entra com a logo à esquerda e Projects / Contact à direita.
- Hovers e foco do cabeçalho preservados: onda de fontes na logo, scramble, sublinhado espectral e atração magnética nos links.
- Depois da abertura, uma gota ASCII cai no centro em 0,95 s. O impacto cria uma onda circular que revela o rio ao longo de 1,85 s.
- A correnteza continua animada: linhas de fluxo, pequenas cristas e espuma nas margens. O restante da tela permanece preto, sem grão ou novas seções.
- Movimento reduzido: logo inicial estática e rio estático, sem queda nem onda. A animação da água pausa quando a aba fica oculta.

React 19 + TypeScript + Vite; GSAP para a entrada do cabeçalho, Geist Mono local e [tte.js](https://github.com/flaviocopes/tte-js) para o efeito Canvas da abertura. O rio usa um motor Canvas 2D local, com atlas de glifos, geometria pré-calculada e desenho limitado a 30 fps, sem atualizações React por frame. Sem Three.js ou React Three Fiber. A dependência MIT tte.js está fixada na revisão `9b120c2f65d48f996a027ef061712bb87ad467bb`, com seus créditos e licenças originais.

## Executar

Node.js 22.12+.

```sh
npm install
npm run dev
```

## Produção

```sh
npm run build
npm run preview
```

`npm run typecheck` executa apenas o TypeScript. `npm run glyphs` regenera a logo oficial e as variantes por letra usadas no hover do cabeçalho.

`?intro=0` pula a abertura, a gota e a onda; exibe o cabeçalho e o rio diretamente. Os antigos parâmetros de cena (`debug`, `t`, `webgl`) foram removidos.

Projects e Contact continuam links mock, sem seções de destino. Os arquivos independentes da capa do GitHub em `github-profile/` não foram alterados.

## Verificação

Build de produção concluído. A sequência `waiting → falling → ripple → flowing` foi exercitada no Chromium: gota centralizada e descendente, revelação radial progressiva e correnteza com pixels variando após o impacto. Desktop 1440×900, mobile 390×844, foco do cabeçalho, movimento reduzido e `?intro=0` verificados, sem erros de execução. O Canvas temporário da logo é descartado; permanece somente o Canvas do rio atrás do cabeçalho.
