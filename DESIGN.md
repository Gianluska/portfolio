# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Uma única tela, sem rolagem. A abertura `lvsk` termina sobre o mesmo grafite da cena. O sol nasce no horizonte plano, acende a paisagem e revela o hero com nome e três roles. A grama se curva em rajadas, sem responder ao ponteiro.

## Elementos preservados

- A logo da abertura é a ASCII oficial Shadow.
- Um de 37 efeitos do tte.js é sorteado a cada carregamento. A animação dura de 1 a 2,75 s, com uma pausa final de 0,25 s, sem repetição.
- A abertura mantém o mesmo fundo grafite (`#2d3038`) do campo. A logo estática usa marfim (`#ece7cd`); `intro-palette` tinge só o Canvas temporário da logo e preserva sua transparência.

## Hero

O hero começa a `36svh`, entre o sol e o campo. O título em Redaction 35 Bold 700 usa o mesmo marfim da cena (`#ece7cd`) e varia com largura e altura para caber em retrato e paisagem. A role em Redaction 35 Regular 400 fica abaixo, centralizada. O céu é mais escuro atrás do texto. Hover ou foco visível abre um slot inline para `"lvsk"` com o mesmo peso e linha de base, em tamanho `0.9em` e marfim atenuado; o nome acessível permanece estável. Com movimento reduzido, a troca de apelido é instantânea.

A família [Redaction 35](https://fonts.google.com/specimen/Redaction+35) unifica o hero; Geist Mono permanece nos glifos. Ambas são locais e usam SIL OFL 1.1. Licenças: `public/fonts/redaction-35-OFL.txt` e `public/fonts/geist-OFL.txt`.

O pacote MIT `ascii-reveal` 0.3.0 fornece o skeleton `dither`. O controlador mede as linhas usando Geist Mono, respeita o limite de 96 colunas e desmonta o `ResizeObserver` ao concluir ou cancelar o efeito. A entrada começa depois que o disco solar libera a área do texto. O nome e a role entram com 50 ms de diferença; o skeleton cobre e libera cada linha em duas fases de 450 ms. Nas trocas seguintes, só a role anima, com pausa de leitura de 3,2 s. O apelido tem ciclo independente.

A role é texto não interativo: clique, Enter e espaço não pausam nem reiniciam o ciclo automático. Não há semântica de botão, foco de teclado, cursor de ação ou tooltip. Leitores de tela recebem uma lista estável das três roles. Ocultar a aba cancela a fase pendente, e movimento reduzido mantém o texto estático. Os canvases temporários de shimmer são removidos ao fim da transição. Desmontar cancela animações e timeouts, resolve a espera pendente, remove estilos e listeners.


## Amanhecer

A câmera é frontal, fixa e nivelada, com horizonte reto a 72% da altura. O primeiro quadro tem apenas o fundo grafite: o disco está oculto pelo plano do campo. O sol sobe durante 3,8 s. Primeiro aparece o halo e o bordo do disco; sua elevação governa o brilho das nuvens e o avanço da luz pelo solo. O primeiro plano permanece escuro até depois das touceiras distantes. Quando o sol libera a área do texto, começa o reveal do hero.

### Campo e vento

As gramíneas são baixas no enquadramento e crescem em seis faixas de profundidade. As lâminas e plumas distantes têm poucos pixels; as mais próximas ficam maiores, sem romper a linha do horizonte. Cada faixa ganha luz de acordo com a altura do sol e sua distância. As raízes permanecem fixas: duas ondas com fases baseadas na posição fazem as rajadas atravessarem as touceiras. As sementes no ar só aparecem com a luz.

### Rasterização

`DawnLandscape` mantém céu, halo e gradação do solo em cache. `WindMeadow` refaz geometria e fases no redimensionamento e agrupa os traços por tom e profundidade. `CanvasPalette` quantiza o Canvas 2D CPU-backed em grafite e marfim, com limiares de blue noise e raster de aproximadamente 0,9 megapixel ou menos. Depois do amanhecer, só as linhas alcançadas pela grama e pelas sementes são atualizadas. O Canvas da cena não usa filtro CSS, WebGL ou loop extra.

## Movimento reduzido

A logo permanece estática. A cena mostra o sol já alto e o campo em um quadro fixo. Ocultar a aba pausa a animação; desmontar cancela o frame e remove os listeners.


