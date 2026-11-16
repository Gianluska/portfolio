# Gianlucca Claudino — portfolio

Portfólio com abertura ASCII, cabeçalho, hero tipográfico e uma superfície aberta de água em caracteres ocupando a tela inteira. Sem baralho ou cena 3D.

## Experiência atual

- A cada carregamento, um dos 37 efeitos do tte.js é sorteado para revelar a logo ASCII oficial. A animação dura entre 1 e 2,75 s, seguida de uma pausa final de 0,25 s: ciclo de no máximo 3 s, sem repetição em loop. A abertura permanece monocromática.
- A abertura desaparece e o cabeçalho entra com a logo à esquerda e Projects / Contact à direita.
- Hovers e foco do cabeçalho preservados: onda de fontes na logo, scramble, sublinhado espectral e atração magnética nos links.
- Depois da abertura, a gota ASCII cai no centro em 0,95 s. O impacto gera uma onda na própria superfície, circular no plano da água e projetada obliquamente na tela. A crista e a depressão alteram normais, reflexos e posições dos caracteres; a onda revela o mar até cobrir a viewport em 2,8 s, sem anéis sobrepostos.
- Aos 0,75 s da entrada do rio — 3 s antes da revelação completa do mar — o hero apresenta `Gianlucca Claudino` e as roles abaixo. O bloco fica centralizado verticalmente à esquerda, com texto alinhado ao início. O `AsciiSkeleton` original de [ascii-reveal](https://github.com/quanhoangindex/ascii-reveal), fixado em 0.3.0, usa blocos `dither` e shimmer em uma onda da esquerda para a direita: o placeholder entra em 450 ms e revela o novo texto na mesma direção nos 450 ms seguintes. O nome recebe o efeito uma vez; as roles ciclam entre `Creative Technologist` → `Frontend Specialist` → `Product Engineer`, com pausas de leitura de 3,2 s. Clique ou Enter/espaço pausam e retomam. Movimento reduzido mantém o texto estático.
- A água ocupa toda a tela em perspectiva inclinada, sem canal, margens ou horizonte desenhado. Cristas largas e suaves em `~`, encostas em `-`, vales em `.` e brilhos raros em `*` preservam o mar calmo. As ondas se comprimem e suavizam ao fundo e ficam mais amplas no primeiro plano; as frequências distantes são filtradas para evitar cintilação.
- O vento aparece em listras ASCII longas, sem espirais, camadas ou ramificações. Uma nova passagem começa a cada 1,25 s e dura 12 s, permitindo até dez simultâneas. Opacidades base entre 0,20 e 0,38 variam suavemente com a distância, com pontas suaves e ondulação lenta. Traços de peso 500 mantêm espessura legível, sem a dupla compressão vertical que os tornava quase invisíveis. O comprimento acompanha a profundidade, até aproximadamente 560 px no desktop e 80% da largura no mobile. Os campos de pressão continuam afetando a água sem aumentar a altura das ondas.
- Os pássaros usam silhuetas compactas de três linhas e cinco colunas ASCII, com bico, corpo e asas em três poses. Voam sozinhos, em pares ou em setas de cinco, com um líder e dois pares atrás. Cada bando nasce inteiro fora da tela, entra por uma borda lateral e sai pela oposta, sem fade no meio da cena. Um novo grupo surge a cada 5,5 s, com voos de 12 a 15 s e até três grupos simultâneos. O navio assusta o bando dentro de um raio que acompanha a profundidade; todos fogem para longe do casco, batendo as asas mais rápido. O cursor sozinho não assusta pássaros.
- O navio antigo acompanha o ponteiro em vista oblíqua: casco e convés giram sobre o plano da água, enquanto os três mastros e as velas permanecem erguidos. O tamanho acompanha a distância. Ele começa a entrar assim que a shock wave toca o centro da borda inferior, com fade de 0,8 s. A bandeira continua tremulando com direção suavizada e as três velas enfunam fora de fase. Tudo usa o mesmo Canvas e relógio, sem novos loops.
- A névoa se concentra ao fundo: um véu atmosférico reduz o contraste da água distante e bancos largos se deslocam devagar sobre o plano do mar, com textura ASCII e dispersão suave. O mesmo véu passa sobre as brisas e o navio, integrando o barco aos bancos de névoa; o primeiro plano permanece mais limpo. Insetos, poeira, pássaros e hero ficam à frente. Dois atlas pequenos são reutilizados, sem blur ou noise por pixel durante a animação.
- Pássaros, brisas, névoa, insetos e poeira compartilham profundidade: escala, espaçamento, opacidade e velocidade aparente diminuem à distância. A espuma e a esteira permanecem ancoradas ao casco; o navio continua assustando os bandos.
- Movimento reduzido: logo inicial e água estáticas, sem queda, onda, brisas, pássaros, insetos, poeira ou névoa. A animação pausa quando a aba fica oculta.

React 19 + TypeScript + Vite; GSAP para a entrada do cabeçalho, Geist Mono local e [tte.js](https://github.com/flaviocopes/tte-js) para o efeito Canvas da abertura. A água usa um motor Canvas 2D local, com dois swells e seis ondas de vento direcionais, normais analíticas e reflexos suaves. A projeção inversa amostra o plano inclinado; as fases espaciais e os filtros por profundidade são pré-calculados. `AsciiPerspective` compartilha a escala de distância entre água e atores. Desenho limitado a 30 fps, sem atualizações React por frame, Three.js ou React Three Fiber. A dependência MIT tte.js está fixada na revisão `9b120c2f65d48f996a027ef061712bb87ad467bb`, com seus créditos e licenças originais.

Tipografia do hero: [Redaction 35](https://fonts.google.com/specimen/Redaction+35) Bold 700 no nome e [Roboto](https://fonts.google.com/specimen/Roboto) regular 400 nas roles. Geist Mono permanece no ASCII e no cabeçalho. Todas são gratuitas para uso comercial sob SIL OFL 1.1, sem demos ou negrito sintetizado. Os arquivos WOFF2 são locais, com preload e espera do carregamento antes do reveal. As licenças ficam em `public/fonts/redaction-35-OFL.txt`, `public/fonts/roboto-OFL.txt` e `public/fonts/geist-OFL.txt`.

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

A perspectiva foi conferida visualmente no Chromium em 1440×900 e 390×844, incluindo navegação do navio, entrada normal e retomada após movimento reduzido. O desenho nativo isolado verificou a contenção da revelação projetada e a estabilidade e dissipação da esteira em 1440×900, 390×844 e 844×390. Uma prancha de quatro rumos verificou a silhueta oblíqua com mastros erguidos. Movimento reduzido manteve os pixels estáticos. Sem erros de execução observados.

A rasterização em lote reduziu em aproximadamente 83% a mediana do custo de desenho no cenário isolado de 45 quadros em 1440×900. Isso mede o tempo da chamada de desenho, não FPS nem tempo de GPU. As máscaras preservaram a cobertura antialias da composição nativa, inclusive com sobreposição e recorte nas bordas (diferença máxima de um nível de alpha).

## Referências da água

- [GPU Gems — Effective Water Simulation from Physical Models](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): soma de ondas, derivadas analíticas e filtragem.
- [Ocean waves with WebGL — Matthias Volk](https://relint.de/waves.html): dispersão, normais e contribuição da reflexão para a leitura da água. A implementação local não utiliza FFT nem WebGL.
- [Obsessed Waves — Ken Goyarola](https://kgaw.io/projects/obsessed-waves/): referência visual de continuidade e profundidade em ASCII; seu código, objetos e controles não foram incorporados.

