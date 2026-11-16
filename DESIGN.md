# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Preservar a abertura da logo `lvsk`, o cabeçalho e a gota aprovada. Depois do impacto, um mar calmo ocupa toda a tela em perspectiva oblíqua: a água se comprime e perde contraste ao fundo, e o primeiro plano ganha escala. Navio, brisas, pássaros e partículas compartilham a mesma leitura de distância. Tudo é ASCII monocromático. Sem ilhas, canal, margens continentais, céu, sol ou novo conteúdo de apresentação.

## Elementos preservados

- A logo final é a ASCII oficial Shadow. As trocas de fontes FIGlet permanecem apenas nas interações do cabeçalho.
- Um dos 37 efeitos do tte.js é sorteado a cada carregamento. A animação dura entre 1 e 2,75 s, seguida de uma pausa final de 0,25 s: ciclo de no máximo 3 s. Uma única execução; novos sorteios podem repetir um efeito.
- A abertura permanece monocromática, inclusive nos efeitos com paletas próprias, sem afetar as cores das interações do cabeçalho.
- Logo no topo esquerdo, com escala visual de 0,9 e deslocamento de -4 px no eixo vertical. A área de interação e a posição de Projects / Contact no topo direito permanecem intactas.
- Entrada do cabeçalho e interações existentes de hover/foco, sem redesenho.

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

O vento usa uma única listra ASCII por passagem, sem variantes de estilo, espirais, camadas ou caudas divididas. Uma nova passagem começa a cada 1,25 s e dura 12 s, com até dez simultâneas. Cada uma mantém sua opacidade entre 0,14 e 0,34 e sua posição e direção durante redimensionamentos. O comprimento fica em torno de 560 px, limitado a 80% da largura da tela. Apenas glifos `-`, sem falhas aleatórias ou sombra duplicada; pontas suaves, entrada de 1,1 s e saída de 1,5 s. Uma ondulação rasa com fase de 0,65 rad/s deforma lentamente cada listra enquanto ela atravessa a superfície em velocidade constante.

Dois swells longos (5 e 3,6 unidades) e seis ondas de vento (2 a 0,74), com direções espalhadas até ±0,35 rad, compõem a superfície contínua. As amplitudes curtas são baixas, o que mantém a inclinação suave, e a velocidade de fase foi reduzida. As cristas formam faixas amplas e tranquilas. O vento de base varia a ondulação em apenas ±10%; cada brisa modula somente as ondas de vento, e seus campos de pressão e derivadas entram na altura e nas normais. Sem máscaras Perlin ou recortes de visibilidade por noise.

### Navio e esteira

Um navio antigo a vela visto em perspectiva oblíqua, com casco, convés, popa, gurupés, três mastros verticais, cordame e velas quadradas. O rumo gira a base do casco no plano comprimido da água; mastros e velas permanecem erguidos, em vez de girar como um adesivo plano. O tamanho acompanha a profundidade. Ele começa a entrar assim que a shock wave alcança o centro da borda inferior, ainda durante a revelação, com fade de 0,8 s. O contato fica fixado na primeira passagem, inclusive durante redimensionamentos. O ponteiro continua guiando o navio com aceleração, frenagem e leme suaves; as margens consideram a altura dos mastros. As velas enfunam fora de fase e a bandeira segue o vento e a popa com amortecimento, sem viradas abruptas. A espuma nasce na linha d'água, atrás do casco, nunca na ponta dos mastros. Com movimento reduzido, o barco é omitido.

A orientação da bandeira interpola os ângulos do vento e da popa, em vez de somar vetores opostos que podem se cancelar e provocar uma virada brusca. A direção é suavizada no espaço da tela pelo arco mais curto, com amortecimento exponencial de resposta 4 s⁻¹ (cerca de 0,75 s para percorrer 95% da transição). Acelerar, frear ou retomar durante a volta mantém a continuidade; o tremular dos segmentos permanece independente.

A esteira vem do casco, não do ponteiro. Uma equação de onda 2D amortecida roda na grade a 60 Hz. A propagação de referência de 170 px/s e a área pressionada se projetam conforme a profundidade: menores e mais comprimidas ao fundo. Uma faixa de absorção de 90 px amortece a velocidade da onda progressivamente nas bordas, sem reflexão deliberada. O perfil de pressão tem média zero, força de referência de 0,0424 × 1,15 e modulação pela velocidade do navio. As cristas recebem um realce discreto, com deslocamento dos caracteres limitado a 0,5 px. A simulação para quando o campo assenta e é desativada com movimento reduzido.

### Leitura de superfície

`AsciiPerspective` define a escala de profundidade contínua de 0,3 no alto a 1,1 embaixo e a compressão do plano de 0,55. A água usa a projeção inversa para amostrar os mesmos swells e ondas de vento no plano, sem deformar um bitmap. Fases espaciais, distâncias da onda de impacto e filtros por linha são pré-calculados; frequências que não cabem nas células distantes são atenuadas antes do desenho. A shock wave é circular no plano da água e projetada obliquamente na tela. A altura normalizada escolhe `~`, `-` ou `.`, preservando a altura visual baixa de 0,35, o contraste suave e o filtro de luz de 125 ms. Glifos distantes são menores e mais tênues. A opacidade permanece contínua, sem recorte aleatório.

### Pássaros

Somente voos solo, pares e formações em seta triangular de cinco pássaros: um líder, um par atrás e outro par mais aberto. Cada pássaro usa três linhas e cinco colunas ASCII com um pequeno bico, um glifo de corpo, cauda curta e três poses de asas, sem pescoço ou penas separados. Fonte de 8 px e entrelinha de 5,5 px. O bico acompanha a direção do voo e a sombra permanece discreta. Um grupo novo surge a cada 5,5 s, com duração entre 12 e 15 s e até três grupos simultâneos. O espaçamento preserva a separação entre as silhuetas nas duas larguras. As formações permanecem estáveis durante cada voo e em redimensionamentos; não há sprites, imagens ou modelos.

Os pássaros se assustam com o barco, não com o cursor. O alcance de referência é de 170 px no desktop e 120 px no mobile, multiplicado pela profundidade média do pássaro e do casco. Um membro próximo dispara a fuga do bando inteiro. Cada pássaro foge para longe do navio, mantendo parte do rumo anterior; os mais próximos reagem primeiro. Aceleração, velocidade de fuga e atraso entre membros acompanham a escala de distância. As asas batem três vezes mais rápido e o bico segue a direção real do voo. O susto pertence a cada voo, sobrevive ao nascimento do bando seguinte e mantém seus deslocamentos durante redimensionamentos. O cursor só guia o barco; longe do casco, o bando segue calmo.



### Insetos, poeira e névoa

Após a revelação completa, insetos pequenos de quatro asas e corpo `:` pairam em trajetórias irregulares e contínuas. São até oito no desktop e três em 390 × 844 px, com fonte de 7 px, pequenas correções de rumo e batida de asas independente do deslocamento. Cada voo dura entre 20 e 31,9 s, com entrada e saída suaves, sem trocar de posição enquanto visível.

A poeira usa pontos e apóstrofos isolados, sem grão sobre a tela: até 32 partículas no desktop e 12 em 390 × 844 px, fonte de 9 px e opacidade entre 0,14 e 0,32 antes dos fades. Deriva para a direita e sobe lentamente em ciclos de 18–30 s; desaparece antes de reiniciar o percurso.

A névoa forma até três bancos baixos no desktop e dois no mobile. Passa a 7–10 px/s, com bordas suaves, pequenas ondulações e textura ASCII `.:-`. Um pequeno atlas de dispersão luminosa é gerado uma única vez e reutilizado sob os caracteres, com opacidade máxima do véu de 0,067. A névoa é desenhada atrás do navio e dos pássaros; insetos e poeira ficam à frente do navio. As três camadas entram suavemente em 2 s, preservam a paleta monocromática e não alteram as ondas.

## Movimento reduzido

A logo inicial permanece na fonte oficial. O cabeçalho e a água estática aparecem sem coreografia de entrada, queda ou onda. Brisas, pássaros, insetos, poeira e névoa são omitidos. A preferência também é respeitada quando muda durante a sessão; os controles mantêm foco visível.

## Implementação

React, TypeScript, Vite e GSAP. Geist Mono local. O catálogo de tte.js fornece os efeitos da abertura em um Canvas temporário, destruído ao terminar ou desmontar o componente. `AsciiRiver` controla o Canvas 2D: amostragem inversa do plano inclinado, fases espaciais e filtros por profundidade pré-calculados, atlas dos caracteres do mar, soma dos campos de vento e desenho limitado a 30 fps.

`AsciiAtmosphere` compartilha o tempo desde a revelação com `AsciiBirdFlocks`, `AsciiBreezes` e `AsciiBoat`. Os pássaros reutilizam três slots de coortes; as brisas reutilizam buffers de posição e opacidade com capacidade para dez listras e expõem dez campos de pressão; o barco reutiliza um anel de 48 pontos de espuma e expõe posição, rumo e velocidade para que `AsciiRiver` aplique a esteira. O barco é desenhado entre as brisas e os pássaros. Não há alocações de arrays por frame, timers, listeners ou loops adicionais. A aba oculta pausa o relógio; movimento reduzido limpa os atores e mantém só a água estática. Desmontar cancela o frame e remove os listeners do controlador. As variantes FIGlet permanecem no cabeçalho. Sem Three.js / React Three Fiber e sem novas seções ou informações pessoais.

`AsciiRiverAir` reutiliza buffers fixos para insetos, poeira e caracteres de névoa e um atlas fora do DOM para o véu. Compartilha o relógio e a pausa do controlador existente, sem novos listeners, timers, loops ou dependências. A densidade acompanha a área da viewport; a névoa é desenhada antes das brisas, e as partículas antes dos pássaros.

As camadas atmosféricas usam `sceneScale`: bandos e espaçamentos diminuem ao fundo, assim como a velocidade aparente e o raio de susto do navio. As brisas distantes ficam mais curtas, finas e translúcidas; os campos de pressão acompanham o desenho. A névoa se achata sobre a água e insetos e poeira variam escala, opacidade e deriva com a distância. Sem novos loops ou listeners.

## Referências

[GPU Gems, capítulo 1](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) fundamenta ondas, normais e filtragem. [Matthias Volk](https://relint.de/waves.html) fundamenta a leitura de reflexos na água. [Obsessed Waves](https://kgaw.io/projects/obsessed-waves/) foi inspecionado como referência visual de ASCII e profundidade, sem copiar sua implementação ou seus objetos.

