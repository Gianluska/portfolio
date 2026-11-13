# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Preservar a abertura da logo `lvsk`, o cabeçalho e a gota aprovada. Depois do impacto, a água mais clara ocupa a tela inteira em vista vertical de cima, sem perspectiva oblíqua. Listras de brisa ASCII longas e translúcidas, com opacidades diferentes, e pequenos bandos dão vida à superfície. Uma ilha no canto superior direito segue a referência desenhada pelo usuário, com píer, árvores, grama e clareira com fogueira. Tudo é ASCII monocromático, exceto as chamas vermelhas. Sem canal, margens continentais, céu, sol ou novo conteúdo de apresentação.

## Elementos preservados

- A logo final é a ASCII oficial Shadow. As trocas de fontes FIGlet permanecem apenas nas interações do cabeçalho.
- Um dos 37 efeitos do tte.js é sorteado a cada carregamento. A animação dura entre 1 e 2,75 s, seguida de uma pausa final de 0,25 s: ciclo de no máximo 3 s. Uma única execução; novos sorteios podem repetir um efeito.
- A abertura permanece monocromática, inclusive nos efeitos com paletas próprias, sem afetar as cores das interações do cabeçalho.
- Logo no topo esquerdo, com escala visual de 0,9 e deslocamento de -4 px no eixo vertical. A área de interação e a posição de Projects / Contact no topo direito permanecem intactas.
- Entrada do cabeçalho e interações existentes de hover/foco, sem redesenho.

## Fundo

#000000, com um único Canvas 2D decorativo atrás do cabeçalho, cobrindo toda a viewport. O grão pertence apenas ao loader. A água é um mar calmo: cristas claras e largas, vales escuros com pontilhado tênue e a mesma escala no alto e embaixo da tela. Brisas e pássaros são desenhados com caracteres no mesmo Canvas, sem imagens ou WebGL.

### Sequência do rio

1. Somente após o loader desaparecer: uma gota pequena, centralizada no eixo horizontal, cai por 0,95 s até o centro da tela.
2. O impacto solta o respingo e gera uma onda radial na própria superfície. Uma crista de elevação e uma depressão posterior se propagam em velocidade constante durante 2,8 s, até a onda ultrapassar os cantos da tela. As derivadas desse perfil alteram as normais e os reflexos da água; a altura desloca seus caracteres, e a crista recebe um realce mais claro. Somente a superfície alcançada pela onda é revelada, com borda suavizada de 24 px. Não há contornos ou anéis sobrepostos. A onda sai da viewport e deixa o mar inteiro visível.
3. Quando a onda alcança o centro da borda inferior, um navio ASCII começa a entrar por ela, sem esperar a revelação dos cantos. Só após a revelação completa começam as passagens discretas de brisa e os pequenos pássaros. O ponteiro guia o barco, cujo casco perturba a superfície (ver "Navio e esteira"); não há outros controles.

### Água e vento

O vento usa uma única listra ASCII por passagem, sem variantes de estilo, espirais, camadas ou caudas divididas. Uma nova passagem começa a cada 1,25 s e dura 12 s, com até dez simultâneas. Cada uma mantém sua opacidade entre 0,14 e 0,34 e sua posição e direção durante redimensionamentos. O comprimento fica em torno de 560 px, limitado a 80% da largura da tela. Apenas glifos `-`, sem falhas aleatórias ou sombra duplicada; pontas suaves, entrada de 1,1 s e saída de 1,5 s. Uma ondulação rasa com fase de 0,65 rad/s deforma lentamente cada listra enquanto ela atravessa a superfície em velocidade constante.

Dois swells longos (5 e 3,6 unidades) e seis ondas de vento (2 a 0,74), com direções espalhadas até ±0,35 rad, compõem a superfície contínua. As amplitudes curtas são baixas, o que mantém a inclinação suave, e a velocidade de fase foi reduzida. As cristas formam faixas amplas e tranquilas. O vento de base varia a ondulação em apenas ±10%; cada brisa modula somente as ondas de vento, e seus campos de pressão e derivadas entram na altura e nas normais. Sem máscaras Perlin ou recortes de visibilidade por noise.

### Ilha e clareira

`AsciiIsland` reproduz o contorno da referência: enseada estreita no norte, bosque agrupado a oeste, uma árvore isolada a nordeste e outra no lobo sul. Copas são vistas de cima, com contornos e ramificações em caracteres; grama usa pequenos tufos `,|` e `,'`. A clareira central fica sem grama, com uma borda pontilhada e passagem para o píer. O pequeno porto sai da costa para sudeste, com tábuas transversais, duas bordas e quatro postes `o`, todos monocromáticos.

A ilha ocupa uma grade de 67 × 45 células, com fonte de 10 px, avanço de 6 px e entrelinha de 8 px. O desenho estático é armazenado em um atlas 2× e dimensionado para até 420 px no desktop e 304 px no mobile, respeitando o cabeçalho e a altura disponível. O fundo preto do terreno e do píer oculta a água e os atores de superfície; os atores aéreos são desenhados por cima.

Pedras e lenha permanecem brancas/cinzas. Só as chamas usam vermelho `#e34b4b`, em três poses ASCII a 6 fps no mesmo relógio do rio, sem glow ou reflexos coloridos. A ilha é recortada pelo raio de revelação da shock wave, aparecendo progressivamente com a água. Em movimento reduzido, ilha e fogueira continuam visíveis e estáticas. Não há novos elementos DOM, listeners ou loops.

### Navio e esteira

Um navio antigo a vela, em ASCII e visto de cima (quinze linhas e quinze colunas, fonte de 10 px, entrelinha de 8,5 px, cerca de 90 × 128 px: gurupés com estai, proa em ponta, três mastros `o` com vergas e velas redondas enfunadas mais largas que o casco, castelo de popa `[___]` e leme). As velas têm um leve preenchimento claro, como lona, sobre um fundo escuro que esconde a água sob o navio. Ele entra pela borda inferior assim que o raio da shock wave alcança metade da altura da viewport, ainda durante a revelação, com fade de 0,8 s. O instante de contato é fixado na primeira passagem, então redimensionar não reinicia sua entrada. O centro nasce 40 px abaixo da tela, deixando a proa já visível, e navega até um ponto de repouso a 64% da altura. Quando o ponteiro aparece, o navio o persegue: vira até 2,8 rad/s, com leme que perde força em baixa velocidade, acelera a 380 px/s² até 230 px/s e freia a 240 px/s². A quilha amortece o deslize lateral, então as curvas cortam a água em vez de derrapar. Com o alvo atrás, o barco reduz a velocidade para fazer a curva fechada. Ele para a 90 px do cursor, com o gurupés perto dele, em vez de orbitar e, quando o ponteiro some, vai parando por inércia. Uma vez dentro da tela, fica preso a 64 px das bordas, com o navio inteiro visível. Parado, balança levemente. As três velas enfunam com rajadas, fora de fase: a barriga curva até 5 px, deformando cada glifo da borda inferior e o preenchimento de lona juntos, sem deslocar as vergas. A bandeira no mastro principal tem nove segmentos duplos `~`, fonte de 11 px e peso 600, cerca de 59 px de comprimento e opacidade entre 0,665 e 0,945. Afina até uma ponta única, tremula com amplitude crescente e segue o vento predominante (leste, levemente ao sul) em repouso, girando para a popa conforme ganha velocidade. Quase parado, ondinhas `(`/`)` e depois `~` se afastam do casco a cada 2,6 s, nas faixas entre as velas. Em movimento, a popa solta espuma em dois braços (`:` e depois `.`) que se abrem e desaparecem em 1,4 s, com um rastro curto de popa (`*`, `~`) no centro. Com movimento reduzido, o barco é omitido.

A orientação da bandeira interpola os ângulos do vento e da popa, em vez de somar vetores opostos que podem se cancelar e provocar uma virada brusca. A direção é suavizada no espaço da tela pelo arco mais curto, com amortecimento exponencial de resposta 4 s⁻¹ (cerca de 0,75 s para percorrer 95% da transição). Acelerar, frear ou retomar durante a volta mantém a continuidade; o tremular dos segmentos permanece independente.

A esteira vem do casco, não do ponteiro. Uma equação de onda 2D amortecida roda na própria grade de glifos, a 60 Hz, com propagação de 170 px/s. As bordas não refletem: uma faixa de absorção de 90 px amortece apenas a velocidade da onda, com perda que cresce quadraticamente até 30% por passo na borda da tela. Assim, a esteira sai da viewport como se o mar continuasse, sem bater e voltar dos cantos. A energia refletida caiu de 8–11% para cerca de 0,15%. A cada célula percorrida, um ponto 4 px atrás do meio do casco aplica um perfil de média zero ("chapéu mexicano", raio de 2,2 células) com força de 0,0424 × 1,15, escalada pela velocidade: o centro afunda e a borda sobe, então não acumula água ao longo do caminho. Como a velocidade máxima do barco (230 px/s) passa a das ondas (170 px/s), ele forma uma esteira em V; manobras lentas abrem anéis locais. A distorção é sutil: a altura da esteira entra com peso baixo no nível que escolhe o glifo, suas derivadas entram com metade da força nas normais (luz e brilhos `*`), as cristas recebem um realce de opacidade quase imperceptível e os caracteres se deslocam no máximo 0,5 px na direção da inclinação. A amplitude perde cerca de um terço por segundo e a simulação para quando o campo assenta. Abaixo de 5% da velocidade máxima, o casco não empurra a água. Com movimento reduzido, a esteira é desativada.

### Leitura de superfície

A câmera é vertical, ortográfica, com direção de visão fixa e escala uniforme. A altura normalizada escolhe o caractere: `~` só nas cristas mais altas, `-` nas encostas e `.` nos vales. O swell só levanta levemente o padrão, com peso de 0,35; quem define onde as cristas aparecem é o mar de vento. As ondas são baixas: a altura visual de 0,35 reduz as inclinações usadas na luz e o contraste entre cristas e vales a cerca de um terço. Os vales continuam legíveis e as cristas ficam só um pouco mais claras. A luz vem da face voltada ao sol, e um filtro temporal de 125 ms a suaviza. O brilho especular estreito clareia a crista; apenas as facetas mais quentes viram `*`, raras. Frequências que não cabem nas células são atenuadas. A opacidade é contínua, sem recorte aleatório.

### Pássaros

Somente voos solo, pares e formações em seta triangular de cinco pássaros: um líder, um par atrás e outro par mais aberto. Cada pássaro usa três linhas e cinco colunas ASCII com um pequeno bico, um glifo de corpo, cauda curta e três poses de asas, sem pescoço ou penas separados. Fonte de 8 px e entrelinha de 5,5 px. O bico acompanha a direção do voo e a sombra permanece discreta. Um grupo novo surge a cada 5,5 s, com duração entre 12 e 15 s e até três grupos simultâneos. O espaçamento preserva a separação entre as silhuetas nas duas larguras. As formações permanecem estáveis durante cada voo e em redimensionamentos; não há sprites, imagens ou modelos.

Os pássaros se assustam com o barco, não com o cursor. Quando o centro do navio chega a 170 px de qualquer membro (120 px no mobile), o bando inteiro dispara. Cada pássaro foge em linha reta para longe do barco, mantendo um pouco do rumo anterior, e o bando se espalha. Os mais próximos reagem primeiro; os demais, com atraso proporcional à distância (700 px/s). A fuga acelera a 1.100 px/s² até 520 px/s e leva o bando para fora da tela em cerca de 2 s, sem retorno à rota. Durante a fuga, as asas batem três vezes mais rápido e o bico segue a direção real do voo. O susto pertence a cada voo: sobrevive ao nascimento do bando seguinte, e o próximo grupo chega calmo. Bandos fora do raio seguem a rota normal. O cursor só guia o barco; um bando sob o cursor, mas longe do casco, segue calmo.



### Insetos, poeira e névoa

Após a revelação completa, insetos pequenos de quatro asas e corpo `:` pairam em trajetórias irregulares e contínuas. São até oito no desktop e três em 390 × 844 px, com fonte de 7 px, pequenas correções de rumo e batida de asas independente do deslocamento. Cada voo dura entre 20 e 31,9 s, com entrada e saída suaves, sem trocar de posição enquanto visível.

A poeira usa pontos e apóstrofos isolados, sem grão sobre a tela: até 32 partículas no desktop e 12 em 390 × 844 px, fonte de 9 px e opacidade entre 0,14 e 0,32 antes dos fades. Deriva para a direita e sobe lentamente em ciclos de 18–30 s; desaparece antes de reiniciar o percurso.

A névoa forma até três bancos baixos no desktop e dois no mobile. Passa a 7–10 px/s, com bordas suaves, pequenas ondulações e textura ASCII `.:-`. Um pequeno atlas de dispersão luminosa é gerado uma única vez e reutilizado sob os caracteres, com opacidade máxima do véu de 0,067. A névoa é desenhada atrás do navio e dos pássaros; insetos e poeira ficam à frente do navio. As três camadas entram suavemente em 2 s, preservam a paleta monocromática e não alteram as ondas.

## Movimento reduzido

A logo inicial permanece na fonte oficial. O cabeçalho, a água, a ilha e a fogueira estáticas aparecem sem coreografia de entrada, queda ou onda. Brisas, pássaros, insetos, poeira e névoa são omitidos. A preferência também é respeitada quando muda durante a sessão; os controles mantêm foco visível.

## Implementação

React, TypeScript, Vite e GSAP. Geist Mono local. O catálogo de tte.js fornece os efeitos da abertura em um Canvas temporário, destruído ao terminar ou desmontar o componente. `AsciiRiver` controla o Canvas 2D: grade ortográfica uniforme, fases espaciais pré-calculadas, atlas com os cinco caracteres do mar, soma dos campos de vento e desenho limitado a 30 fps.

`AsciiAtmosphere` compartilha o tempo desde a revelação com `AsciiBirdFlocks`, `AsciiBreezes` e `AsciiBoat`. Os pássaros reutilizam três slots de coortes; as brisas reutilizam buffers de posição e opacidade com capacidade para dez listras e expõem dez campos de pressão; o barco reutiliza um anel de 48 pontos de espuma e expõe posição, rumo e velocidade para que `AsciiRiver` aplique a esteira. O barco é desenhado entre as brisas e os pássaros. Não há alocações de arrays por frame, timers, listeners ou loops adicionais. A aba oculta pausa o relógio; movimento reduzido limpa os atores e mantém só a água estática. Desmontar cancela o frame e remove os listeners do controlador. As variantes FIGlet permanecem no cabeçalho. Sem Three.js / React Three Fiber e sem novas seções ou informações pessoais.

`AsciiRiverAir` reutiliza buffers fixos para insetos, poeira e caracteres de névoa e um atlas fora do DOM para o véu. Compartilha o relógio e a pausa do controlador existente, sem novos listeners, timers, loops ou dependências. A densidade acompanha a área da viewport; a névoa é desenhada antes das brisas, e as partículas antes dos pássaros.

## Referências

[GPU Gems, capítulo 1](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) fundamenta ondas, normais e filtragem. [Matthias Volk](https://relint.de/waves.html) fundamenta a leitura de reflexos na água. [Obsessed Waves](https://kgaw.io/projects/obsessed-waves/) foi inspecionado como referência visual de ASCII e profundidade, sem copiar sua implementação ou seus objetos.

