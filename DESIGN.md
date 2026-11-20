# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Preservar a abertura da logo `lvsk`, o cabeçalho e a gota aprovada. Depois do impacto, um mar calmo ocupa toda a tela em perspectiva oblíqua. Um hero tipográfico central apresenta o nome solicitado e as três roles, sem CTA ou texto adicional. Navio, brisas, pássaros e partículas preservam a leitura de distância e a paleta monocromática. Sem ilhas, canal, margens continentais, céu ou sol.

## Elementos preservados

- A logo final é a ASCII oficial Shadow. As trocas de fontes FIGlet permanecem apenas nas interações do cabeçalho.
- Um dos 37 efeitos do tte.js é sorteado a cada carregamento. A animação dura entre 1 e 2,75 s, seguida de uma pausa final de 0,25 s: ciclo de no máximo 3 s. Uma única execução; novos sorteios podem repetir um efeito.
- A abertura permanece monocromática, inclusive nos efeitos com paletas próprias, sem afetar as cores das interações do cabeçalho.
- Logo no topo esquerdo, com escala visual de 0,9 e deslocamento de -4 px no eixo vertical. A área de interação e a posição de Projects / Contact no topo direito permanecem intactas.
- Entrada do cabeçalho e interações existentes de hover/foco, sem redesenho.

## Hero

O hero fica centralizado verticalmente à esquerda da tela, com o mesmo recuo lateral do cabeçalho e texto alinhado ao início. O título apresenta `Gianlucca Claudino` em Redaction 35 Bold 700, branco, de 40 a 96 px, entrelinha de 1,05 e tracking de −0,01 em. Não há linha `aka`. No hover com ponteiro preciso, o texto completo fica `Gianlucca "lvsk" Claudino`: o apelido entre aspas herda a mesma família, peso, tracking e linha de base do nome, com tamanho de 0,9 em (10% menor). A cor muda para `#d4d4d4`, levemente mais escura que o branco. Sem sublinhado. Um slot inline de grid abre espaço em 400 ms com `--out`; a alteração de layout fica limitada ao título. Opacidade, deslocamento de 3 px e escala de 0,96 acompanham a abertura e se assentam no alinhamento natural. O mesmo skeleton ASCII revela o apelido em 400 ms; sair reverte a animação a partir do ponto atual, sem reiniciar a textura. O shimmer roda só durante a transição. Foco visível de teclado também revela o apelido; o nome acessível é estável. Hover é restrito a `(hover: hover) and (pointer: fine)`, sem hover preso após toque. Movimento reduzido mantém a troca instantânea, sem textura ou movimento. A grafia original é preservada; em telas estreitas, o nome pode quebrar entre as palavras sem cortar o texto. As roles usam Redaction 35 Regular 400, de 24 a 32 px, entrelinha de 1,35 e alinhamento à esquerda. O intervalo entre título e descrição varia de 8 a 12 px; a role conserva 6 px de padding vertical e altura mínima de 44 px. A box do reveal tem a largura intrínseca da maior das três frases: cópias invisíveis das opções de `ROLES` compartilham uma célula de grid com a linha visível. O medidor é `aria-hidden` e removido ao desmontar. As fontes são locais e pré-carregadas; o controlador aguarda os pesos efetivos antes de medir as linhas do reveal.

A família [Redaction 35](https://fonts.google.com/specimen/Redaction+35) unifica o hero: Bold no título, Regular nas roles. Geist Mono permanece no ASCII e no cabeçalho. Neotheric DEMO e sua licença pessoal foram removidas. Redaction 35 e [Geist](https://github.com/vercel/geist-font) usam SIL OFL 1.1, permitem uso comercial, self-host e distribuição junto do projeto e têm licenças em `public/fonts/redaction-35-OFL.txt` e `public/fonts/geist-OFL.txt`. Nenhuma fonte depende de CDN em runtime.

O pacote MIT `ascii-reveal` 0.3.0 fornece o `AsciiSkeleton` original via `asciiSkeletonHTML`, `animateSkeleton` e `SKELETON_CSS`, com variante `dither`. Seus blocos têm limite de 96 colunas: antes de renderizar a entrada e a role, o controlador mede o avanço real de `M` em Geist Mono e aumenta o tamanho das células apenas quando necessário para cobrir toda a largura, com uma coluna de folga para arredondamento. As linhas da textura acompanham a altura real. Um `ResizeObserver` existe somente enquanto esse skeleton está ativo; ao terminar ou cancelar, ele é desconectado e o tamanho temporário é removido. Cada transição de entrada ou ciclo dura 900 ms e usa duas varreduras lineares: por 450 ms, o placeholder cresce da esquerda para a direita; nos 450 ms seguintes, recua na mesma direção e revela o texto. A entrada é escalonada por WAAPI: nome em 0 ms e role em 50 ms. Nas trocas seguintes, apenas a role anima, com pausa de leitura de 3,2 s. A interação do apelido tem animações e limpeza independentes, sem interferir no ciclo ou na entrada. O hero começa 3 s antes da revelação completa do mar: aos 0,75 s do relógio do rio, ainda durante a queda da gota. O gatilho usa esse mesmo relógio e dispara uma única vez; pular a abertura ou ativar movimento reduzido mantém a entrada imediata.

A role é texto não interativo: clique, Enter e espaço não pausam nem reiniciam o ciclo automático. Não há semântica de botão, foco de teclado, cursor de ação ou tooltip. Leitores de tela recebem uma lista estável das três roles. Ocultar a aba cancela a fase pendente, e movimento reduzido mantém o texto estático. Os canvases temporários de shimmer são removidos ao fim da transição. Desmontar cancela animações e timeouts, resolve a espera pendente, remove estilos e listeners.


## Fundo

#000000, com um único Canvas 2D decorativo atrás do cabeçalho, cobrindo toda a viewport. O grão pertence apenas ao loader. Cristas largas e suaves e vales pontilhados formam o mar; as faixas convergem e se comprimem ao fundo. O ponto de fuga fica acima da viewport, sem horizonte desenhado. Todos os atores permanecem em caracteres no mesmo Canvas, sem imagens ou WebGL.

A composição final do rio usa `brightness(1.56)`: o ganho inicial de 30% seguido por mais 20% ilumina água, brisas, pássaros, névoa e partículas, preservando o preto de fundo e a profundidade relativa. O navio usa tinta `#d5d5d5` para compensar o segundo aumento e manter aproximadamente o brilho anterior. O filtro não afeta o loader nem o cabeçalho.

### Rasterização da água

As coberturas antialias dos glifos são pré-renderizadas em cada tamanho projetado, compartilhando máscaras para dimensões iguais. A água inteira é rasterizada em um buffer RGBA reutilizado, alinhado aos pixels do dispositivo, e enviada ao Canvas em uma única imagem por quadro. Isso substitui milhares de chamadas de desenho de glifos; não há leitura do Canvas visível durante a animação.

### Sequência do rio

1. Somente após o loader desaparecer: uma gota pequena, centralizada no eixo horizontal, cai por 0,95 s até o centro da tela.
2. O impacto solta o respingo e gera uma onda radial na própria superfície. Uma crista de elevação e uma depressão posterior se propagam em velocidade constante durante 2,8 s, até a onda ultrapassar os cantos da tela. As derivadas desse perfil alteram as normais e os reflexos da água; a altura desloca seus caracteres, e a crista recebe um realce mais claro. Somente a superfície alcançada pela onda é revelada, com borda suavizada de 24 px. Não há contornos ou anéis sobrepostos. A onda sai da viewport e deixa o mar inteiro visível.
3. Quando a onda alcança o centro da borda inferior, um navio ASCII começa a entrar por ela, sem esperar a revelação dos cantos. Só após a revelação completa começam as passagens discretas de brisa e os pequenos pássaros. O ponteiro guia o barco, cujo casco perturba a superfície (ver "Navio e esteira"); não há outros controles.

### Água e vento

O vento usa uma única listra ASCII por passagem, sem variantes de estilo, espirais, camadas ou caudas divididas. Uma nova passagem começa a cada 1,25 s e dura 12 s, com até dez simultâneas. A opacidade base varia entre 0,20 e 0,38, com atenuação suave pela distância em vez de multiplicação direta pela profundidade. O comprimento chega a 560 px, limitado a 80% da largura e escalado pela distância. Apenas glifos `-` de 11 px e peso 500, sem falhas aleatórias ou sombra duplicada; pontas suaves, entrada de 1,1 s e saída de 1,5 s. O traçado já se comprime no plano da água; a tinta não recebe uma segunda compressão e mantém escala vertical mínima de 0,85 para continuar legível. A ondulação rasa de 0,65 rad/s, o ritmo das passagens e os campos de pressão permanecem.

Dois swells longos (5 e 3,6 unidades) e seis ondas de vento (2 a 0,74), com direções espalhadas até ±0,35 rad, compõem a superfície contínua. As amplitudes curtas são baixas, o que mantém a inclinação suave, e a velocidade de fase foi reduzida. As cristas formam faixas amplas e tranquilas. O vento de base varia a ondulação em apenas ±10%; cada brisa modula somente as ondas de vento, e seus campos de pressão e derivadas entram na altura e nas normais. Sem máscaras Perlin ou recortes de visibilidade por noise.

### Navio e esteira

Um navio antigo a vela visto em perspectiva oblíqua, com casco, convés, popa, gurupés, três mastros verticais, cordame e velas quadradas. O rumo gira a base do casco no plano comprimido da água; mastros e velas permanecem erguidos, em vez de girar como um adesivo plano. O tamanho acompanha a profundidade. Ele começa a entrar assim que a shock wave alcança o centro da borda inferior, ainda durante a revelação, com fade de 0,8 s. O contato fica fixado na primeira passagem, inclusive durante redimensionamentos. O ponteiro continua guiando o navio com aceleração, frenagem e leme suaves; as margens consideram a altura dos mastros. As velas enfunam fora de fase e a bandeira segue o vento e a popa com amortecimento, sem viradas abruptas. A espuma nasce na linha d'água, atrás do casco, nunca na ponta dos mastros. Com movimento reduzido, o barco é omitido.

A orientação da bandeira interpola os ângulos do vento e da popa, em vez de somar vetores opostos que podem se cancelar e provocar uma virada brusca. A direção é suavizada no espaço da tela pelo arco mais curto, com amortecimento exponencial de resposta 4 s⁻¹ (cerca de 0,75 s para percorrer 95% da transição). Acelerar, frear ou retomar durante a volta mantém a continuidade; o tremular dos segmentos permanece independente.

A esteira vem do casco, não do ponteiro. Uma equação de onda 2D amortecida roda na grade a 60 Hz. A propagação de referência de 170 px/s e a área pressionada se projetam conforme a profundidade: menores e mais comprimidas ao fundo. Uma faixa de absorção de 90 px amortece a velocidade da onda progressivamente nas bordas, sem reflexão deliberada. O perfil de pressão tem média zero, força de referência de 0,0424 × 1,15 e modulação pela velocidade do navio. As cristas recebem um realce discreto, com deslocamento dos caracteres limitado a 0,5 px. A simulação para quando o campo assenta e é desativada com movimento reduzido.

### Leitura de superfície

`AsciiPerspective` define a escala de profundidade contínua de 0,3 no alto a 1,1 embaixo e a compressão do plano de 0,55. A água usa a projeção inversa para amostrar os mesmos swells e ondas de vento no plano, sem deformar um bitmap. Fases espaciais, distâncias da onda de impacto e filtros por linha são pré-calculados; frequências que não cabem nas células distantes são atenuadas antes do desenho. A shock wave é circular no plano da água e projetada obliquamente na tela. A altura normalizada escolhe `~`, `-` ou `.`, preservando a altura visual baixa de 0,35, o contraste suave e o filtro de luz de 125 ms. Glifos distantes são menores e mais tênues. A opacidade permanece contínua, sem recorte aleatório.

### Pássaros

Somente voos solo, pares e formações em seta triangular de cinco pássaros: um líder, um par atrás e outro par mais aberto. Cada pássaro usa três linhas e cinco colunas ASCII com um pequeno bico, um glifo de corpo, cauda curta e três poses de asas, sem pescoço ou penas separados. Fonte de 8 px e entrelinha de 5,5 px. O bico acompanha a direção do voo e a sombra permanece discreta. Um grupo novo surge a cada 5,5 s, com duração entre 12 e 15 s e até três grupos simultâneos. O espaçamento preserva a separação entre as silhuetas nas duas larguras. As formações permanecem estáveis durante cada voo e em redimensionamentos; não há sprites, imagens ou modelos.

Cada bando já nasce completamente formado fora da borda esquerda ou direita e cruza a tela antes de sair pela borda oposta. A margem considera a formação inteira e o tamanho dos glifos. A profundidade altera escala, espaçamento, contraste e curva vertical, mas nunca encurta a travessia da viewport. Não há fade de surgimento ou desaparecimento dentro da cena.

Os pássaros se assustam com o barco, não com o cursor. O alcance de referência é de 170 px no desktop e 120 px no mobile, multiplicado pela profundidade média do pássaro e do casco. Um membro próximo dispara a fuga do bando inteiro. Cada pássaro foge para longe do navio, mantendo parte do rumo anterior; os mais próximos reagem primeiro. Aceleração, velocidade de fuga e atraso entre membros acompanham a escala de distância. As asas batem três vezes mais rápido e o bico segue a direção real do voo. O susto pertence a cada voo, sobrevive ao nascimento do bando seguinte e mantém seus deslocamentos durante redimensionamentos. O cursor só guia o barco; longe do casco, o bando segue calmo.



### Insetos, poeira e névoa

Após a revelação completa, insetos pequenos de quatro asas e corpo `:` pairam em trajetórias irregulares e contínuas. São até oito no desktop e três em 390 × 844 px, com fonte de 7 px, pequenas correções de rumo e batida de asas independente do deslocamento. Cada voo dura entre 20 e 31,9 s, com entrada e saída suaves, sem trocar de posição enquanto visível.

A poeira usa pontos e apóstrofos isolados, sem grão sobre a tela: até 32 partículas no desktop e 12 em 390 × 844 px, fonte de 9 px e opacidade entre 0,14 e 0,32 antes dos fades. Deriva para a direita e sobe lentamente em ciclos de 18–30 s; desaparece antes de reiniciar o percurso.

A névoa concentra-se ao fundo e se dissipa gradualmente em direção ao primeiro plano. A opacidade de todas as camadas de névoa é multiplicada por 0,30, preservando movimento, textura e profundidade. O véu atmosférico contínuo tem opacidade de até 0,054 e reduz o contraste da água distante sem desenhar horizonte. Sobre ele passam até três bancos largos e baixos no desktop e dois no mobile, com bordas suaves, pequenas ondulações e textura ASCII `.:-`. Os bancos têm espalhamento espesso e opacidade modulada lentamente em torno de 0,06, reforçada à distância; a compressão vertical preserva o plano do mar. O mesmo véu é composto uma única vez sobre água, brisas e navio: o barco recebe a névoa nos bancos e à distância, enquanto o primeiro plano permanece mais limpo. Insetos, poeira, pássaros e hero ficam à frente da névoa. Sua entrada suave de 2 s começa 2 s antes do fim da revelação da água, sem antecipar insetos, poeira ou brisas e sem alterar a física das ondas.

## Movimento reduzido

A logo inicial permanece na fonte oficial. O cabeçalho e a água estática aparecem sem coreografia de entrada, queda ou onda. Brisas, pássaros, insetos, poeira e névoa são omitidos. A preferência também é respeitada quando muda durante a sessão; os controles mantêm foco visível.

## Implementação

React, TypeScript, Vite e GSAP. Geist Mono local. O catálogo de tte.js fornece os efeitos da abertura em um Canvas temporário, destruído ao terminar ou desmontar o componente. `AsciiRiver` controla o Canvas 2D: amostragem inversa do plano inclinado, fases espaciais e filtros por profundidade pré-calculados, atlas dos caracteres do mar, soma dos campos de vento e desenho limitado a 30 fps.

`AsciiAtmosphere` compartilha o tempo desde a revelação com `AsciiBirdFlocks`, `AsciiBreezes` e `AsciiBoat`. Os pássaros reutilizam três slots de coortes; as brisas reutilizam buffers de posição e opacidade com capacidade para dez listras e expõem dez campos de pressão; o barco reutiliza um anel de 48 pontos de espuma e expõe posição, rumo e velocidade para que `AsciiRiver` aplique a esteira. O barco é desenhado entre as brisas e os pássaros. Não há alocações de arrays por frame, timers, listeners ou loops adicionais. A aba oculta pausa o relógio; movimento reduzido limpa os atores e mantém só a água estática. Desmontar cancela o frame e remove os listeners do controlador. As variantes FIGlet permanecem no cabeçalho. Sem Three.js / React Three Fiber e sem novas seções ou informações pessoais.

`AsciiRiverAir` reutiliza buffers fixos para insetos, poeira e caracteres de névoa e dois atlas pequenos fora do DOM: um gradiente de distância de 4 × 256 px e uma textura de bancos de 256 × 96 px. Gradientes são gerados apenas no construtor; o desenho usa até quatro cópias de imagem por quadro, sem blur ou noise por pixel. Compartilha o relógio e a pausa do controlador existente, sem novos listeners, timers, loops ou dependências. A névoa é desenhada depois das brisas e do navio; as partículas e os pássaros ficam por cima. Não há segundo passe de névoa ou buffers novos. Movimento reduzido omite a névoa junto dos demais atores atmosféricos.

As camadas atmosféricas usam `sceneScale`: bandos e espaçamentos diminuem ao fundo, assim como a velocidade aparente e o raio de susto do navio. As brisas distantes ficam mais curtas, finas e translúcidas; os campos de pressão acompanham o desenho. A névoa se achata sobre a água e insetos e poeira variam escala, opacidade e deriva com a distância. Sem novos loops ou listeners.

## Referências

[GPU Gems, capítulo 1](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) fundamenta ondas, normais e filtragem. [Matthias Volk](https://relint.de/waves.html) fundamenta a leitura de reflexos na água. [Obsessed Waves](https://kgaw.io/projects/obsessed-waves/) foi inspecionado como referência visual de ASCII e profundidade, sem copiar sua implementação ou seus objetos.

## Projects transition

One gesture drives a four-second sine-eased camera move over the first `220svh`. As the camera nears the original waterfall angle, its vertical descent starts before the pitch finishes. The brink moves above the viewport and the same water continues past the bottom of the frame. Filaments thin into spray, and their light fades with camera depth. Selected work starts entering at 3.15 seconds, overlapping the last part of the descent with no blackout pause. Native scrolling resumes at four seconds. Returning above Projects reverses the same camera curve and the editorial fade, including when Home or the logo starts the return from farther down the page.

The sea and waterfall share one ground plane and a fixed drop edge. Camera zoom moves from 1 to 0.58 and ground tilt from 0.55 to 0.10. The lip rises from below the viewport and passes above it as the camera descends. Only the static reduced-motion composition shows the impact line near 90% of the viewport. Water fills the width, without cliffs, islands, colored lights, or an inserted image.

The falling water uses thin, low-opacity ASCII filaments rather than fixed vertical columns. Material points cross the brink and accelerate toward the impact, with irregular highlights, small commas and colons, and short thread strokes. The lip stays stationary; there is no separate folded band or periodic deformation. Whitewater at the impact remains a softly blended, advected density field with rounded billows, fine grain, sparse bubble contours, rising mist, and ballistic droplets with short trails. Broken, low-contrast ripples spread beneath the impact. Seed buffers, glyph masks, and the existing 30 fps clock remain shared.

The river and fall use one continuous material trajectory: constant projected entry velocity upstream, followed by a quadratic downward displacement. Transported texture is keyed to emission time, so highlights travel with the water rather than pulsing across the whole edge. Material sample phases and counts do not change during camera travel. Opacity compensates for overlapping samples near the slow brink, and short fading trails preserve the falling filaments.

The fall is densest at the brink and dissipates as it descends, like a tall free-falling waterfall. After the first fifth of the drop, filaments lose up to 60% of their opacity, scatter sideways by up to 34 px at full scale, and give way to loose dots and mist glyphs. Their streak trails fade out by the lower half. Impact foam is softened into a diffuse mist base, dimmer than the water at the crest; pooled ripples are unchanged.

Visual references: [Adam Rhodes — clear water crossing a waterfall edge](https://uppbeat.io/stock-video/asset/close-up-of-water-flowing-over-waterfall-edge-168394), inspected as footage and stills, and [Seth Dunlap — Nature in Motion at Niagara Falls](https://www.filmsupply.com/shoots/nature-in-motion-at-niagara-falls/24899), inspected via its crest close-up. These guide continuous flow, irregular travelling highlights, and the absence of repeating transverse folds; no reference media is bundled with the site.

Waterfall particles follow their own trajectories without pointer input. The ship's pointer steering at sea is unchanged.


`AsciiSceneCamera` owns the projection, depth and fall light. `AsciiWaterfall` plots into the reusable water pixel buffer and glyph masks. The stream's ballistic path extends below the shot at a fixed sampling cadence; no pool enters the moving shot. Spatial phases update only while the water plane is visible. `SceneNavigation` drives the shared timeline, and `AsciiRiver` reads scroll position and stops rendering once the editorial surface has arrived.

Reduced motion restores native scrolling throughout, switches between static sea and waterfall compositions at the midpoint, and skips the descent and section motion. Sections have no fragment anchors for now; the logo remains the keyboard-accessible way back to the sea.

## Selected work, profile and contact

[Hamish Williams](https://hamishw.com/) is the structural reference: immersive introduction, selected work in sequence, then a personal profile and a short path to contact. This portfolio keeps its existing top header, ASCII art and monochrome UI. Redaction 35 carries section titles and local Geist sets project names and body text. Numbered previews alternate image position on desktop and preserve text-first reading order on mobile. The calendar links to its published repository; the ASCII project is followed by a short in-page study, then About me and Get in touch. Project media uses the real calendar screenshot and a captured frame of the ASCII ocean.

The title starts to enter as the last drops dim. Text follows, then the artwork rises slightly as it fades in. Case study, profile and contact reveal as they enter the viewport using a shared `IntersectionObserver`; revealed sections stay visible, while the first project's entrance replays after a new dive. Focused controls are never delayed by a reveal.

