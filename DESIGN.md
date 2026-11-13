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

#000000, com um único Canvas 2D decorativo atrás do cabeçalho, cobrindo toda a viewport. O grão pertence apenas ao loader. A água é um mar calmo: cristas claras e largas, vales escuros com pontilhado tênue e a mesma escala no alto e embaixo da tela. Brisas e pássaros são desenhados com caracteres no mesmo Canvas, sem imagens ou WebGL.

### Sequência do rio

1. Somente após o loader desaparecer: uma gota pequena, centralizada no eixo horizontal, cai por 0,95 s até o centro da tela.
2. O impacto solta o respingo e gera uma onda radial na própria superfície. Uma crista de elevação e uma depressão posterior se propagam em velocidade constante durante 2,8 s, até a onda ultrapassar os cantos da tela. As derivadas desse perfil alteram as normais e os reflexos da água; a altura desloca seus caracteres, e a crista recebe um realce mais claro. Somente a superfície alcançada pela onda é revelada, com borda suavizada de 24 px. Não há contornos ou anéis sobrepostos. A onda sai da viewport e deixa o mar inteiro visível.
3. A onda passa e deixa a água ondulando em vista superior. Após a revelação, começam passagens discretas de brisa e pequenos pássaros, sem controles ou interações de mouse adicionais.

### Água e vento

O vento usa uma única listra ASCII por passagem, sem variantes de estilo, espirais, camadas ou caudas divididas. Uma nova passagem começa a cada 1,25 s e dura 12 s, com até dez simultâneas. Cada uma mantém sua opacidade entre 0,14 e 0,34 e sua posição e direção durante redimensionamentos. O comprimento fica em torno de 560 px, limitado a 80% da largura da tela. Apenas glifos `-`, sem falhas aleatórias ou sombra duplicada; pontas suaves, entrada de 1,1 s e saída de 1,5 s. Uma ondulação rasa com fase de 0,65 rad/s deforma lentamente cada listra enquanto ela atravessa a superfície em velocidade constante.

Dois swells longos (5 e 3,6 unidades) e seis ondas de vento (2 a 0,74), com direções espalhadas até ±0,35 rad, compõem a superfície contínua. As amplitudes curtas são baixas, o que mantém a inclinação suave, e a velocidade de fase foi reduzida. As cristas formam faixas amplas e tranquilas. O vento de base varia a ondulação em apenas ±10%; cada brisa modula somente as ondas de vento, e seus campos de pressão e derivadas entram na altura e nas normais. Sem máscaras Perlin ou recortes de visibilidade por noise.

### Leitura de superfície

A câmera é vertical, ortográfica, com direção de visão fixa e escala uniforme. A altura normalizada escolhe o caractere: `~` só nas cristas mais altas, `-` nas encostas e `.` nos vales. O swell só levanta levemente o padrão, com peso de 0,35; quem define onde as cristas aparecem é o mar de vento. As ondas são baixas: a altura visual de 0,35 reduz as inclinações usadas na luz e o contraste entre cristas e vales a cerca de um terço. Os vales continuam legíveis e as cristas ficam só um pouco mais claras. A luz vem da face voltada ao sol, e um filtro temporal de 125 ms a suaviza. O brilho especular estreito clareia a crista; apenas as facetas mais quentes viram `*`, raras. Frequências que não cabem nas células são atenuadas. A opacidade é contínua, sem recorte aleatório.

### Pássaros

Somente voos solo, pares e formações em seta triangular de cinco pássaros: um líder, um par atrás e outro par mais aberto. Cada pássaro usa três linhas e cinco colunas ASCII com um pequeno bico, um glifo de corpo, cauda curta e três poses de asas, sem pescoço ou penas separados. Fonte de 8 px e entrelinha de 5,5 px. O bico acompanha a direção da trajetória e a sombra permanece discreta. Um grupo novo surge a cada 5,5 s, com duração entre 12 e 15 s e até três grupos simultâneos. O espaçamento preserva a separação entre as silhuetas nas duas larguras. As formações permanecem estáveis durante cada voo e em redimensionamentos; não há sprites, imagens ou modelos.



## Movimento reduzido

A logo inicial permanece na fonte oficial. O cabeçalho e a água estática aparecem sem coreografia de entrada, queda ou onda. Brisas e pássaros são omitidos. A preferência também é respeitada quando muda durante a sessão; os controles mantêm foco visível.

## Implementação

React, TypeScript, Vite e GSAP. Geist Mono local. O catálogo de tte.js fornece os efeitos da abertura em um Canvas temporário, destruído ao terminar ou desmontar o componente. `AsciiRiver` controla o Canvas 2D: grade ortográfica uniforme, fases espaciais pré-calculadas, atlas com os cinco caracteres do mar, soma dos campos de vento e desenho limitado a 30 fps.

`AsciiAtmosphere` compartilha o tempo desde a revelação com `AsciiBirdFlocks` e `AsciiBreezes`. Os pássaros reutilizam três slots de coortes; as brisas reutilizam buffers de posição e opacidade com capacidade para dez listras e expõem dez campos de pressão. Não há alocações de arrays por frame, timers, listeners ou loops adicionais. A aba oculta pausa o relógio; movimento reduzido limpa os atores e mantém só a água estática. Desmontar cancela o frame e remove os listeners do controlador. As variantes FIGlet permanecem no cabeçalho. Sem Three.js / React Three Fiber e sem novas seções ou informações pessoais.

## Referências

[GPU Gems, capítulo 1](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) fundamenta ondas, normais e filtragem. [Matthias Volk](https://relint.de/waves.html) fundamenta a leitura de reflexos na água. [Obsessed Waves](https://kgaw.io/projects/obsessed-waves/) foi inspecionado como referência visual de ASCII e profundidade, sem copiar sua implementação ou seus objetos.

