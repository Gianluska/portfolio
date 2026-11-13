# Gianlucca Claudino — portfolio

Portfólio com abertura ASCII, cabeçalho e uma superfície aberta de água em caracteres ocupando a tela inteira. Sem hero, baralho ou cena 3D.

## Experiência atual

- A cada carregamento, um dos 37 efeitos do tte.js é sorteado para revelar a logo ASCII oficial. A animação dura entre 1 e 2,75 s, seguida de uma pausa final de 0,25 s: ciclo de no máximo 3 s, sem repetição em loop. A abertura permanece monocromática.
- A abertura desaparece e o cabeçalho entra com a logo à esquerda e Projects / Contact à direita.
- Hovers e foco do cabeçalho preservados: onda de fontes na logo, scramble, sublinhado espectral e atração magnética nos links.
- Depois da abertura, a gota ASCII cai no centro em 0,95 s. O impacto gera uma onda na própria superfície: uma crista elevada e uma depressão atrás dela alteram as normais, os reflexos e a posição dos caracteres. A onda se propaga radialmente em velocidade constante, revelando o mar atrás dela até cobrir toda a tela em 2,8 s. Não há anéis desenhados por cima da água.
- A água ocupa toda a tela em vista vertical de cima, sem canal, margens, horizonte ou compressão de perspectiva. Ela é lida como mar calmo: cristas largas e suaves em `~`, encostas em `-`, vales com pontilhado tênue em `.` e brilhos raros de sol em `*`. Dois swells longos sombreiam áreas amplas; ondas de vento de baixa inclinação definem as cristas e se movem devagar. O vento e as brisas encrespam levemente apenas as ondas curtas.
- O vento aparece em listras ASCII longas, sem espirais, camadas ou ramificações. Uma nova passagem começa a cada 1,25 s e dura 12 s, permitindo até dez listras simultâneas. Cada uma tem opacidade própria entre 0,14 e 0,34, com pontas suaves e ondulação lenta. Os traços chegam a aproximadamente 560 px no desktop e 80% da largura no mobile. Todos os campos de pressão continuam afetando a água.
- Os pássaros usam silhuetas compactas de três linhas e cinco colunas ASCII, com bico, corpo e asas em três poses, sem pescoço ou detalhes de penas. Voam somente sozinhos, em pares ou em setas triangulares de cinco, com um líder e dois pares atrás. Um novo grupo surge a cada 5,5 s, com voos de 12 a 15 s e até três grupos simultâneos. O espaçamento mantém as silhuetas separadas no desktop e no mobile. O navio a vela assusta o bando: com ele a 170 px de um pássaro, todos fogem para longe dele, batendo as asas mais rápido, e saem da tela.
- O navio antigo acompanha o ponteiro e começa a entrar assim que a shock wave alcança o centro da borda inferior, ainda durante a revelação do mar, com fade de 0,8 s e a proa já dentro da tela. O instante fica fixado para redimensionamentos não reiniciarem a entrada. A bandeira tem nove segmentos ASCII, mais longos, claros e encorpados, com ponta afilada tremulando ao vento. As três velas enfunam fora de fase: o tecido e a borda inferior se curvam juntos, enquanto as vergas permanecem fixas. Tudo usa o mesmo Canvas e relógio, sem novos loops.
- O ar ganhou pequenos insetos ASCII de quatro asas, poeira esparsa que deriva e sobe devagar, e bancos baixos de névoa com véu suave e textura de caracteres. A névoa passa atrás do navio; insetos e poeira ficam à frente. A densidade diminui no mobile, sem mudar a água.
- Movimento reduzido: logo inicial e água estáticas, sem queda, onda, brisas, pássaros, insetos, poeira ou névoa. A animação pausa quando a aba fica oculta.

React 19 + TypeScript + Vite; GSAP para a entrada do cabeçalho, Geist Mono local e [tte.js](https://github.com/flaviocopes/tte-js) para o efeito Canvas da abertura. A água usa um motor Canvas 2D local: dois swells e seis ondas de vento direcionais com dispersão, normais analíticas, sombreamento pela face voltada ao sol e um lóbulo especular estreito. A altura escolhe o caractere e a luz define a opacidade. A projeção ortográfica usa escala uniforme; as fases espaciais são pré-calculadas e as frequências são filtradas conforme o tamanho das células. `AsciiAtmosphere` desenha brisas e pássaros no mesmo Canvas e no mesmo relógio, sem outro loop. Desenho limitado a 30 fps, sem atualizações React por frame. Sem Three.js ou React Three Fiber. A dependência MIT tte.js está fixada na revisão `9b120c2f65d48f996a027ef061712bb87ad467bb`, com seus créditos e licenças originais.

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

Build de produção concluído. Cena real exercitada no Chromium em 1440×900 e 390×844: queda central e impacto preservados, água e atores em movimento, um único Canvas, ausência de overflow, redimensionamento sem trocar o Canvas e `?intro=0`. Movimento reduzido mantém pixels estáticos e a retomada não repete a gota. Sem erros de execução.

A sequência atual foi conferida no Chromium em desktop e mobile: impacto central e onda na própria água, com revelação progressiva até toda a tela. O desenho nativo verificou cinco estágios nas duas larguras, a contenção da água na área alcançada pela onda, a revelação completa e o fim da deformação do impacto. Pássaros simplificados e ventos permanecem. Sem erros de execução nas duas larguras.

## Referências da água

- [GPU Gems — Effective Water Simulation from Physical Models](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): soma de ondas, derivadas analíticas e filtragem.
- [Ocean waves with WebGL — Matthias Volk](https://relint.de/waves.html): dispersão, normais e contribuição da reflexão para a leitura da água. A implementação local não utiliza FFT nem WebGL.
- [Obsessed Waves — Ken Goyarola](https://kgaw.io/projects/obsessed-waves/): referência visual de continuidade e profundidade em ASCII; seu código, objetos e controles não foram incorporados.

