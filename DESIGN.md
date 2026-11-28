# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Uma única tela, sem rolagem. A abertura `lvsk` termina sobre o mesmo grafite da cena. O sol nasce no horizonte plano, acende a paisagem e revela o hero com nome e três roles. A grama se curva em rajadas, sem responder ao ponteiro.

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

A câmera é frontal, fixa e nivelada. O horizonte reto fica a 39% da altura; o solo ocupa os 61% restantes. O primeiro quadro tem apenas o fundo grafite. Em 3,8 s, o sol acelera ao sair do horizonte e desacelera progressivamente até repousar a 15% da altura. Conforme sobe, a luz alcança primeiro a grama logo abaixo do disco, depois se abre para as laterais e avança em direção ao primeiro plano antes do reveal do hero.

Duas camadas de nuvens deslizam a velocidades diferentes. Os filamentos mais próximos velam trechos do disco solar com pontos grafite, deixando seu contorno legível. O halo pulsa devagar, sem mover nem redimensionar o disco.

Pequenos bandos atravessam o céu entre pausas, com asas fora de sincronia. As silhuetas alternam entre grafite e marfim conforme o fundo. Com movimento reduzido, o céu não tem aves.

### Campo e vento

Uma faixa densa de lâminas finas recorta o horizonte. O solo abaixo mantém a mesma quantidade de touceiras por faixa de profundidade; as lâminas crescem em escala conforme se aproximam. Só a luz enfraquece: o gradiente se alonga nas laterais e dá espaço ao texto no centro, inclusive quando o título quebra linha. A crista da rajada passa de ponta a ponta e chega um pouco mais tarde às lâminas próximas. A câmera continua rasa e nivelada.

### Rasterização

`DawnLandscape` mantém as duas texturas contínuas de nuvens, a névoa, o halo e a gradação do solo em cache. `WindMeadow` refaz geometria e fases no redimensionamento e rasteriza as silhuetas em pequenos lotes numa faixa transparente. A luz do amanhecer é aplicada à faixa inteira, sem acúmulo onde as folhas se sobrepõem. `CanvasPalette` quantiza o Canvas 2D CPU-backed em grafite e marfim, com limiares de blue noise e raster de aproximadamente 0,9 megapixel ou menos. Depois do amanhecer, só o céu e a faixa do horizonte são atualizados. O Canvas da cena não usa filtro CSS, WebGL ou loop extra.

## Movimento reduzido

A logo permanece estática. A cena mostra o sol já alto e o campo em um quadro fixo. Ocultar a aba pausa a animação; desmontar cancela o frame e remove os listeners.


