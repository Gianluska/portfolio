# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Uma única tela, sem rolagem, indicador ou cachoeira. A abertura `lvsk` e a gota dão lugar a um mar noturno visto de frente, com câmera nivelada e fixa. O hero mostra o nome e as três roles entre a lua e o navio, sem CTA ou texto extra.

## Elementos preservados

- A logo da abertura é a ASCII oficial Shadow.
- Um de 37 efeitos do tte.js é sorteado a cada carregamento. A animação dura de 1 a 2,75 s, com uma pausa final de 0,25 s, sem repetição.
- A abertura mantém o mesmo fundo grafite (`#2d3038`) da gota e da cena. A logo estática usa marfim (`#ece7cd`); `intro-palette` tinge só o Canvas temporário da logo, inclusive nos efeitos com cores próprias, preservando sua transparência.

## Hero

O hero centralizado começa a `36svh`, entre a lua e a linha d'água. O título em Redaction 35 Bold 700 usa o mesmo marfim da cena (`#ece7cd`) e varia com largura e altura para caber em retrato e paisagem. A role em Redaction 35 Regular 400 fica abaixo, centralizada. Nuvens mais escuras atrás do texto criam contraste sem caixas ou bordas. Hover ou foco visível abre um slot inline para `"lvsk"` com o mesmo peso e linha de base, em tamanho `0.9em` e marfim atenuado; o nome acessível permanece estável. Com movimento reduzido, a troca de apelido é instantânea.

A família [Redaction 35](https://fonts.google.com/specimen/Redaction+35) unifica o hero; Geist Mono permanece nos glifos. Ambas são locais e usam SIL OFL 1.1. Licenças: `public/fonts/redaction-35-OFL.txt` e `public/fonts/geist-OFL.txt`.

O pacote MIT `ascii-reveal` 0.3.0 fornece o `AsciiSkeleton` original via `asciiSkeletonHTML`, `animateSkeleton` e `SKELETON_CSS`, com variante `dither`. Seus blocos têm limite de 96 colunas: antes de renderizar a entrada e a role, o controlador mede o avanço real de `M` em Geist Mono e aumenta o tamanho das células apenas quando necessário para cobrir toda a largura, com uma coluna de folga para arredondamento. As linhas da textura acompanham a altura real. Um `ResizeObserver` existe somente enquanto esse skeleton está ativo; ao terminar ou cancelar, ele é desconectado e o tamanho temporário é removido. Cada transição de entrada ou ciclo dura 900 ms e usa duas varreduras lineares: por 450 ms, o placeholder cresce da esquerda para a direita; nos 450 ms seguintes, recua na mesma direção e revela o texto. A entrada é escalonada por WAAPI: nome em 0 ms e role em 50 ms. Nas trocas seguintes, apenas a role anima, com pausa de leitura de 3,2 s. A interação do apelido tem animações e limpeza independentes, sem interferir no ciclo ou na entrada. O hero começa 3 s antes da revelação completa do mar: aos 0,75 s do relógio do rio, ainda durante a queda da gota. O gatilho usa esse mesmo relógio e dispara uma única vez; pular a abertura ou ativar movimento reduzido mantém a entrada imediata.

A role é texto não interativo: clique, Enter e espaço não pausam nem reiniciam o ciclo automático. Não há semântica de botão, foco de teclado, cursor de ação ou tooltip. Leitores de tela recebem uma lista estável das três roles. Ocultar a aba cancela a fase pendente, e movimento reduzido mantém o texto estático. Os canvases temporários de shimmer são removidos ao fim da transição. Desmontar cancela animações e timeouts, resolve a espera pendente, remove estilos e listeners.


## Fundo

A câmera olha na horizontal. O horizonte reto fica a 72% da viewport e separa o céu iluminado do mar escuro. A lua central fica a 19% da altura; o raio se ajusta às duas dimensões da tela. Nuvens em faixas e névoa no horizonte usam um campo procedural em escala de cinza, recalculado só no redimensionamento. Não há imagem de fundo embutida.

`RiverPalette` lê os mesmos tokens de cor usados pelo loader e converte a composição em duas tintas, grafite (`#2d3038`) e marfim (`#ece7cd`), com a matriz fixa de blue noise. O reflexo central se abre em listras horizontais quebradas conforme se aproxima do primeiro plano. O hero fica fora do Canvas, e o mar não usa filtro CSS.

### Rasterização da água

As coberturas antialias dos glifos são pré-renderizadas a cada tamanho projetado. Só a região abaixo do horizonte usa a grade de ondas e o buffer de água. O raster combinado usa no máximo uma amostra por pixel CSS e cerca de 0,9 megapixel por quadro.

A luz contínua do mar é amostrada na mesma grade da simulação, interpolada pelo Canvas e combinada com os glifos antes de desenhar os atores. A quantização lê uma vez o quadro já composto no Canvas 2D em CPU, converte seu buffer no próprio lugar usando limiares pré-calculados e o devolve ao mesmo Canvas. Não há leitura da GPU, filtro CSS na cena nem segundo loop de animação.

### Sequência do rio

1. Ao sair o loader, a gota cai no eixo central por 0,95 s até o mar.
2. O impacto gera uma onda no plano da água, com uma crista e uma depressão posterior. A frente radial revela o mar ao longo de 2,8 s. O céu entra por esmaecimento no mesmo relógio, sem mover a câmera.
3. O navio aparece de perfil onde a onda cruza o horizonte no centro da tela; brisas e pássaros seguem a revelação.

### Água e vento

O vento usa uma única listra ASCII por passagem, sem variantes de estilo, espirais, camadas ou caudas divididas. Uma nova passagem começa a cada 1,25 s e dura 12 s, com até dez simultâneas. A opacidade base varia entre 0,20 e 0,38, com atenuação suave pela distância em vez de multiplicação direta pela profundidade. O comprimento chega a 560 px, limitado a 80% da largura e escalado pela distância. Apenas glifos `-` de 11 px e peso 500, sem falhas aleatórias ou sombra duplicada; pontas suaves, entrada de 1,1 s e saída de 1,5 s. O traçado já se comprime no plano da água; a tinta não recebe uma segunda compressão e mantém escala vertical mínima de 0,85 para continuar legível. A ondulação rasa de 0,65 rad/s, o ritmo das passagens e os campos de pressão permanecem.

Dois swells longos (5 e 3,6 unidades) e seis ondas de vento (2 a 0,74), com direções espalhadas até ±0,35 rad, compõem a superfície contínua. As amplitudes curtas são baixas, o que mantém a inclinação suave, e a velocidade de fase foi reduzida. As cristas formam faixas amplas e tranquilas. O vento de base varia a ondulação em apenas ±10%; cada brisa modula somente as ondas de vento, e seus campos de pressão e derivadas entram na altura e nas normais. Sem máscaras Perlin ou recortes de visibilidade por noise.

### Navio e esteira

O veleiro começa de perfil no eixo do reflexo, com a linha d'água junto ao horizonte. Contra a névoa clara, casco, mastros e velas são uma silhueta escura; costuras ASCII ficam mais visíveis quando o navio se aproxima. O rumo gira o casco no plano comprimido, sem inclinar os mastros. O ponteiro sobre a água guia o navio, com aceleração, frenagem e leme suaves. Ele não cruza o horizonte.

A orientação da bandeira interpola os ângulos do vento e da popa, em vez de somar vetores opostos que podem se cancelar e provocar uma virada brusca. A direção é suavizada no espaço da tela pelo arco mais curto, com amortecimento exponencial de resposta 4 s⁻¹ (cerca de 0,75 s para percorrer 95% da transição). Acelerar, frear ou retomar durante a volta mantém a continuidade; o tremular dos segmentos permanece independente.

A esteira vem do casco, não do ponteiro. Uma equação de onda 2D amortecida roda na grade a 60 Hz. A propagação de referência de 170 px/s e a área pressionada se projetam conforme a profundidade: menores e mais comprimidas ao fundo. Uma faixa de absorção de 90 px amortece a velocidade da onda progressivamente nas bordas, sem reflexão deliberada. O perfil de pressão tem média zero, força de referência de 0,0424 × 1,15 e modulação pela velocidade do navio. As cristas recebem um realce discreto, com deslocamento dos caracteres limitado a 0,5 px. A simulação para quando o campo assenta e é desativada com movimento reduzido.

### Leitura de superfície

`AsciiPerspective` comprime o plano da água por `0.28` e varia a escala de `0.32` no horizonte a `0.96` no primeiro plano. Fases espaciais, distâncias da onda de impacto e filtros por linha são pré-calculados para a câmera fixa. A altura normalizada escolhe `~`, `-` ou `.`, e a luz favorece a direção da lua.

### Pássaros

Somente voos solo, pares e formações em seta triangular de cinco pássaros: um líder, um par atrás e outro par mais aberto. Cada pássaro usa três linhas e cinco colunas ASCII com um pequeno bico, um glifo de corpo, cauda curta e três poses de asas, sem pescoço ou penas separados. Fonte de 8 px e entrelinha de 5,5 px. O bico acompanha a direção do voo e a sombra permanece discreta. Um grupo novo surge a cada 5,5 s, com duração entre 12 e 15 s e até três grupos simultâneos. O espaçamento preserva a separação entre as silhuetas nas duas larguras. As formações permanecem estáveis durante cada voo e em redimensionamentos; não há sprites, imagens ou modelos.

Cada bando já nasce completamente formado fora da borda esquerda ou direita e cruza a tela antes de sair pela borda oposta. A margem considera a formação inteira e o tamanho dos glifos. A profundidade altera escala, espaçamento, contraste e curva vertical, mas nunca encurta a travessia da viewport. Não há fade de surgimento ou desaparecimento dentro da cena.

Os pássaros se assustam com o barco, não com o cursor. O alcance de referência é de 170 px no desktop e 120 px no mobile, multiplicado pela profundidade média do pássaro e do casco. Um membro próximo dispara a fuga do bando inteiro. Cada pássaro foge para longe do navio, mantendo parte do rumo anterior; os mais próximos reagem primeiro. Aceleração, velocidade de fuga e atraso entre membros acompanham a escala de distância. As asas batem três vezes mais rápido e o bico segue a direção real do voo. O susto pertence a cada voo, sobrevive ao nascimento do bando seguinte e mantém seus deslocamentos durante redimensionamentos. O cursor só guia o barco; longe do casco, o bando segue calmo.



### Insetos, poeira e névoa

Após a revelação completa, insetos pequenos de quatro asas e corpo `:` pairam em trajetórias irregulares e contínuas. São até oito no desktop e três em 390 × 844 px, com fonte de 7 px, pequenas correções de rumo e batida de asas independente do deslocamento. Cada voo dura entre 20 e 31,9 s, com entrada e saída suaves, sem trocar de posição enquanto visível.

A poeira usa pontos e apóstrofos isolados, sem grão sobre a tela: até 32 partículas no desktop e 12 em 390 × 844 px, fonte de 9 px e opacidade entre 0,14 e 0,32 antes dos fades. Deriva para a direita e sobe lentamente em ciclos de 18–30 s; desaparece antes de reiniciar o percurso.

A névoa móvel é recortada ao mar. Um véu contínuo perde opacidade em direção ao primeiro plano; até três bancos com textura ASCII `.:-` passam sobre a água e as brisas. O navio, as partículas e os pássaros são desenhados depois para manter a silhueta legível.

## Movimento reduzido

A logo inicial permanece estática. Céu, mar, reflexo e navio central aparecem sem gota, ondas animadas, brisas, pássaros, insetos, poeira ou névoa móvel. A preferência também é respeitada quando muda durante a sessão.

## Implementação

React, TypeScript, Vite e GSAP. O Canvas temporário do tte.js é desmontado no fim da abertura. `AsciiRiver` controla a grade de ondas e o relógio de até 60 fps. `MoonlitBackdrop` guarda o céu gerado no redimensionamento e reusa as sementes dos reflexos. `AsciiAtmosphere` sincroniza navio, brisas, bandos e partículas com o mesmo relógio; os atores reutilizam seus buffers. `AsciiRiverAir` usa dois atlas pequenos para os bancos e a névoa de distância. A aba oculta pausa o relógio, e desmontar cancela o frame e remove listeners.

As camadas atmosféricas usam `sceneScale`: bandos e espaçamentos diminuem ao fundo, assim como a velocidade aparente e o raio de susto do navio. As brisas distantes ficam mais curtas, finas e translúcidas; os campos de pressão acompanham o desenho. A névoa se achata sobre a água e insetos e poeira variam escala, opacidade e deriva com a distância. Sem novos loops ou listeners.

## Referências

[GPU Gems, capítulo 1](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) fundamenta ondas, normais e filtragem. [Matthias Volk](https://relint.de/waves.html) fundamenta a leitura de reflexos na água. [Obsessed Waves](https://kgaw.io/projects/obsessed-waves/) foi inspecionado como referência visual de ASCII e profundidade, sem copiar sua implementação ou seus objetos.


