# Direção — portfolio Gianlucca Claudino

## Escopo vigente

A abertura `lvsk` termina sobre o mesmo grafite da cena. O sol nasce no horizonte plano, acende a paisagem e revela o hero com nome e três roles. A grama se curva em rajadas, sem responder ao ponteiro. A rolagem alterna entre o campo e o espaço. Em órbita, as experiências por empresa ficam sobre a curva da Terra.

## Elementos preservados

- A logo da abertura é a ASCII oficial Shadow.
- Um de 37 efeitos do tte.js é sorteado a cada carregamento. A animação dura de 1 a 2,75 s, com uma pausa final de 0,25 s, sem repetição.
- A abertura mantém o mesmo fundo grafite (`#2d3038`) do campo. A logo estática usa marfim (`#ece7cd`); `intro-palette` tinge só o Canvas temporário da logo e preserva sua transparência.

## Hero

O hero fica centralizado a `60svh`, sobre o solo escuro e sem grama atrás do texto. O título em Redaction 35 Bold 700 usa o mesmo marfim da cena (`#ece7cd`) e varia com largura e altura para caber em retrato e paisagem. A role em Redaction 35 Regular 400 fica abaixo, centralizada. Hover ou foco visível abre um slot inline para `"lvsk"` com o mesmo peso e linha de base, em tamanho `0.9em` e marfim atenuado; o nome acessível permanece estável. Com movimento reduzido, a troca de apelido é instantânea.

A família [Redaction 35](https://fonts.google.com/specimen/Redaction+35) unifica o hero; Geist Mono permanece nos glifos. Ambas são locais e usam SIL OFL 1.1. Licenças: `public/fonts/redaction-35-OFL.txt` e `public/fonts/geist-OFL.txt`.

O pacote MIT `ascii-reveal` 0.3.0 fornece o skeleton `dither`. O controlador mede as linhas usando Geist Mono, respeita o limite de 96 colunas e desmonta o `ResizeObserver` ao concluir ou cancelar o efeito. A entrada começa depois que o disco solar libera a área do texto. O nome e a role entram com 50 ms de diferença; o skeleton cobre e libera cada linha em duas fases de 450 ms. Nas trocas seguintes, só a role anima, com pausa de leitura de 3,2 s. O apelido tem ciclo independente.

A role é texto não interativo: clique, Enter e espaço não pausam nem reiniciam o ciclo automático. Não há semântica de botão, foco de teclado, cursor de ação ou tooltip. Leitores de tela recebem uma lista estável das três roles. Ocultar a aba cancela a fase pendente, e movimento reduzido mantém o texto estático. Os canvases temporários de shimmer são removidos ao fim da transição. Desmontar cancela animações e timeouts, resolve a espera pendente, remove estilos e listeners.


## Amanhecer

A câmera permanece frontal e nivelada. O plano do campo começa a 39% da altura, com três cristas de vale ao fundo. O primeiro quadro tem apenas o fundo grafite. Em 3,8 s, o sol acelera ao sair do horizonte e desacelera progressivamente até repousar a 15% da altura. Conforme sobe, a luz alcança primeiro a grama logo abaixo do disco, depois se abre para as laterais e avança em direção ao primeiro plano antes do reveal do hero.

Duas camadas de nuvens deslizam a velocidades diferentes. Os filamentos mais próximos velam trechos do disco solar com pontos grafite, deixando seu contorno legível. O halo pulsa devagar sem redimensionar o disco.

Pequenos bandos atravessam o céu entre pausas, com asas fora de sincronia. As silhuetas alternam entre grafite e marfim conforme o fundo. Com movimento reduzido, o céu não tem aves.

### Vale e paralaxe

As três cristas têm grupos de árvores arredondadas e araucárias. As copas distantes são menores e mais apagadas, as intermediárias têm contraste moderado e as da crista próxima são as mais nítidas. A névoa atenua sua base para separar a mata da grama escura. No campo, a câmera acompanha o mouse com deslocamento horizontal discreto, sem mover o texto. A crista arborizada se desloca menos da metade do que a grama na linha do horizonte. Ao sair da janela, a câmera volta ao centro. Toque não desloca a câmera horizontalmente.

### Campo e vento

Uma faixa densa de lâminas finas recorta o horizonte. O solo abaixo mantém a mesma quantidade de touceiras por faixa de profundidade; as lâminas crescem em escala conforme se aproximam. Só a luz enfraquece: o gradiente se alonga nas laterais e dá espaço ao texto no centro, inclusive quando o título quebra linha. A crista da rajada passa de ponta a ponta e chega um pouco mais tarde às lâminas próximas. A câmera continua rasa e nivelada.

### Rasterização

`DawnLandscape` mantém nuvens, névoa, halo e gradação do solo em cache. `ValleyBackdrop` rasteriza as três cristas e suas árvores apenas no redimensionamento e guarda margem para o deslocamento. `WindMeadow` gera também as lâminas fora das bordas que podem entrar no quadro e rasteriza as silhuetas em pequenos lotes numa faixa transparente. `CanvasPalette` quantiza o Canvas 2D CPU-backed em grafite e marfim, com limiares de blue noise e raster de aproximadamente 0,9 megapixel ou menos. No campo iluminado, só o céu e a faixa do horizonte são atualizados. Durante o voo, a composição ocupa o quadro inteiro. O Canvas da cena não usa filtro CSS, WebGL ou loop extra.

## Subida ao espaço

A rolagem nativa fornece apenas o gatilho: cruzar 65% do percurso para baixo inicia a preparação; voltar a 35% cancela a preparação ou inicia a descida. Nos primeiros 1,8 s, o texto do campo se desfaz em faixas descendentes e uma onda de luz se expande ao redor do sol sem alterar o disco. A câmera permanece parada antes da subida de 3,5 s; a descida dura 2,4 s. Se o usuário cruzar o limiar oposto durante o voo, a câmera parte da altitude atual. Os dois botões oferecem o mesmo percurso por toque ou teclado.

O disco solar preserva seu centro e raio durante todo o voo. Depois do campo, passam os cúmulos próximos, com copas iluminadas e bases sombreadas, e os filamentos de cirros em outra velocidade. A névoa da estratosfera se afina até marcar a curvatura da atmosfera, enquanto o halo se contrai e as estrelas aparecem.

A câmera começa a frear antes do destino, passa ligeiramente do ponto de repouso e assenta uma vez, sem deslocar o disco solar. O nome da empresa selecionada nasce atrás do horizonte durante a frenagem; se o scroll inverter no meio do voo, a câmera conserva o impulso ao mudar de direção.

Em órbita, cada estrela pulsa em seu próprio ritmo, sem mudar de posição. Faixas translúcidas correm em velocidades diferentes ao longo da estratosfera. O movimento horizontal do mouse gira a Terra em até 2° por lado em torno do eixo entre o observador e o centro do planeta. O contorno e o brilho da borda ficam fixos; só a superfície e as faixas deslizam por baixo deles. O sol, as estrelas e o texto não se movem. Ao sair da janela, a Terra volta suavemente ao centro. A órbita usa o mesmo Canvas de dois tons, com rasterização a 30 quadros por segundo.

### Experiências em órbita

Em repouso, o contorno da Terra fica a 80% da altura no centro do quadro. O conteúdo é provisório: cinco experiências em empresas fictícias, em `src/data/work.ts`.

Cada empresa é um ponto numa curva paralela ao contorno, abaixo da faixa brilhante. O rótulo em Geist Mono acompanha a tangente da curva e tem um fundo grafite para continuar legível sobre o ruído da superfície. Em telas largas aparecem dois vizinhos de cada lado; em telas estreitas, só os mais próximos. O item ativo vira um anel, sem rótulo.

Navegar é girar o planeta. Roda do mouse ou trackpad, setas, Home/End, clique num vizinho, arraste horizontal e swipe vertical avançam um item por vez, com um pequeno overshoot. A superfície e as correntes giram junto com os rótulos. A inércia do trackpad não pula itens. Nas pontas, a Terra se inclina para o item ausente e volta. Rolar para cima ou fazer swipe para baixo a partir do primeiro item devolve o controle à página e inicia a descida.

O título do item ativo, em Redaction 35 Bold, fica sobre o horizonte. Sua base e seus descendentes ficam escondidos atrás da borda iluminada. Ao trocar de item, o título atual se põe com uma breve subida antes de afundar. Quando o novo ponto passa sob o sol, o halo dá um pulso menor que o da decolagem, e o novo título nasce com a mesma curva do nascer do sol.

Os detalhes (período, papel, resumo, stack e link) formam uma constelação entre o sol e o título. Cada linha tem uma estrela em cruz, ligada à próxima por um traço pontilhado que se desenha por máscara. Em telas largas, as estrelas ficam penduradas sob o sol e os textos se abrem para fora. Em telas estreitas, as estrelas ficam numa margem e o texto se lê para dentro.

A estrutura é uma lista ordenada com foco itinerante e `aria-current`, seguida de um `article` com o título e uma `dl`. Uma região `aria-live` anuncia cada troca.

## Movimento reduzido

A logo permanece estática. A cena mostra o sol já alto e alterna diretamente entre campo e espaço, sem preparação, voo nem paralaxe. Em órbita, a troca de empresa é instantânea, sem giro animado, pulso, poente ou nascente. Ocultar a aba pausa a animação; desmontar cancela o frame e remove os listeners.


