# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Preservar a abertura da logo `lvsk`, o cabeçalho e a gota aprovada. Depois do impacto, a água mais clara ocupa a tela inteira em vista vertical de cima, sem perspectiva oblíqua. Listras de brisa ASCII longas e translúcidas, com opacidades diferentes, e pequenos bandos dão vida à superfície. Sem canal, margens, céu, sol ou novo conteúdo de apresentação.

## Elementos preservados

- A logo final é a ASCII oficial Shadow. As trocas de fontes FIGlet permanecem apenas nas interações do cabeçalho.
- Um dos 37 efeitos do tte.js é sorteado a cada carregamento, com duração aleatória entre 1 e 5 s e pausa final de 0,25 s. Uma única execução; novos sorteios podem repetir um efeito.
- A abertura permanece monocromática, inclusive nos efeitos com paletas próprias, sem afetar as cores das interações do cabeçalho.
- Logo no topo esquerdo, com escala visual de 0,9 e deslocamento de -4 px no eixo vertical. A área de interação e a posição de Projects / Contact no topo direito permanecem intactas.
- Entrada do cabeçalho e interações existentes de hover/foco, sem redesenho.

## Fundo

#000000, com um único Canvas 2D decorativo atrás do cabeçalho, cobrindo toda a viewport. O grão pertence apenas ao loader. A água usa reflexos mais claros e conserva vales escuros; a escala permanece igual no alto e embaixo da tela. Brisas e pássaros são desenhados com caracteres no mesmo Canvas, sem imagens ou WebGL.

### Sequência do rio

1. Somente após o loader desaparecer: uma gota pequena, centralizada no eixo horizontal, cai por 0,95 s até o centro da tela.
2. O impacto solta o respingo e gera uma onda radial na própria superfície. Uma crista de elevação e uma depressão posterior se propagam em velocidade constante durante 2,8 s, até a onda ultrapassar os cantos da tela. As derivadas desse perfil alteram as normais e os reflexos da água; a altura desloca seus caracteres, e a crista recebe um realce mais claro. Somente a superfície alcançada pela onda é revelada, com borda suavizada de 24 px. Não há contornos ou anéis sobrepostos. A onda sai da viewport e deixa o mar inteiro visível.
3. A onda passa e deixa a água ondulando em vista superior. Após a revelação, começam passagens discretas de brisa e pequenos pássaros, sem controles ou interações de mouse adicionais.

### Água e vento

O vento usa uma única listra ASCII por passagem, sem variantes de estilo, espirais, camadas ou caudas divididas. Uma nova passagem começa a cada 1,25 s e dura 12 s, com até dez simultâneas. Cada uma mantém sua opacidade entre 0,14 e 0,34 e sua posição e direção durante redimensionamentos. O comprimento fica em torno de 560 px, limitado a 80% da largura da tela. Apenas glifos `-`, sem falhas aleatórias ou sombra duplicada; pontas suaves, entrada de 1,1 s e saída de 1,5 s. Uma ondulação rasa com fase de 0,65 rad/s deforma lentamente cada listra enquanto ela atravessa a superfície em velocidade constante.

Seis ondas direcionais compõem a superfície contínua; suas normais controlam os reflexos. O vento de base modula as ondas menores. Cada brisa fornece um campo de pressão centrado em sua geometria visível. A água soma todos os campos ativos e suas derivadas para agitar a superfície e manter a reflexão coerente, sem máscaras Perlin ou recortes de visibilidade por noise.

### Leitura de superfície

A câmera é vertical, ortográfica, com direção de visão fixa e escala uniforme. Não há compressão de detalhes distantes nem deslocamento de glifos por altura. A luminosidade de base, os reflexos e a exposição foram elevados sem trocar o fundo preto. As três ondas menores têm amplitudes reduzidas e comprimentos maiores; frequências que não cabem nas células são atenuadas. Antes de escolher o glifo, um filtro temporal de 125 ms suaviza a luminosidade. Uma transição contínua de opacidade substitui o recorte aleatório das células escuras; a cobertura real de tinta no atlas define a ordem dos caracteres.

### Pássaros

Somente voos solo, pares e formações em seta triangular de cinco pássaros: um líder, um par atrás e outro par mais aberto. Cada pássaro usa três linhas e cinco colunas ASCII com um pequeno bico, um glifo de corpo, cauda curta e três poses de asas, sem pescoço ou penas separados. Fonte de 8 px e entrelinha de 5,5 px. O bico acompanha a direção da trajetória e a sombra permanece discreta. Um grupo novo surge a cada 5,5 s, com duração entre 12 e 15 s e até três grupos simultâneos. O espaçamento preserva a separação entre as silhuetas nas duas larguras. As formações permanecem estáveis durante cada voo e em redimensionamentos; não há sprites, imagens ou modelos.



## Movimento reduzido

A logo inicial permanece na fonte oficial. O cabeçalho e a água estática aparecem sem coreografia de entrada, queda ou onda. Brisas e pássaros são omitidos. A preferência também é respeitada quando muda durante a sessão; os controles mantêm foco visível.

## Implementação

React, TypeScript, Vite e GSAP. Geist Mono local. O catálogo de tte.js fornece os efeitos da abertura em um Canvas temporário, destruído ao terminar ou desmontar o componente. `AsciiRiver` controla o Canvas 2D: grade ortográfica uniforme, fases espaciais pré-calculadas, atlas de glifos, soma dos campos de vento e desenho limitado a 30 fps.

`AsciiAtmosphere` compartilha o tempo desde a revelação com `AsciiBirdFlocks` e `AsciiBreezes`. Os pássaros reutilizam três slots de coortes; as brisas reutilizam buffers de posição e opacidade com capacidade para dez listras e expõem dez campos de pressão. Não há alocações de arrays por frame, timers, listeners ou loops adicionais. A aba oculta pausa o relógio; movimento reduzido limpa os atores e mantém só a água estática. Desmontar cancela o frame e remove os listeners do controlador. As variantes FIGlet permanecem no cabeçalho. Sem Three.js / React Three Fiber e sem novas seções ou informações pessoais.

## Referências

[GPU Gems, capítulo 1](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) fundamenta ondas, normais e filtragem. [Matthias Volk](https://relint.de/waves.html) fundamenta a leitura de reflexos na água. [Obsessed Waves](https://kgaw.io/projects/obsessed-waves/) foi inspecionado como referência visual de ASCII e profundidade, sem copiar sua implementação ou seus objetos.

