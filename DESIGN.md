# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Preservar a abertura da logo `lvsk` e o cabeçalho. Depois da abertura, uma gota ASCII cai no centro; seu impacto gera uma onda que revela um rio sinuoso de caracteres. A correnteza continua animada sobre fundo preto, sem hero, baralho, prisma, escultura ou textos de apresentação.

## Elementos preservados

- A logo final é a ASCII oficial Shadow. As trocas de fontes FIGlet permanecem apenas nas interações do cabeçalho.
- Um dos 37 efeitos do tte.js é sorteado a cada carregamento, com duração aleatória entre 1 e 5 s e pausa final de 0,25 s. Uma única execução; novos sorteios podem repetir um efeito.
- A abertura permanece monocromática, inclusive nos efeitos com paletas próprias, sem afetar as cores das interações do cabeçalho.
- Logo no topo esquerdo, com escala visual de 0,9 e deslocamento de -4 px no eixo vertical. A área de interação e a posição de Projects / Contact no topo direito permanecem intactas.
- Entrada do cabeçalho e interações existentes de hover/foco, sem redesenho.

## Fundo

#000000, com um único Canvas 2D decorativo atrás do cabeçalho. O grão pertence apenas ao loader e desaparece com ele. O rio é desenhado exclusivamente com glifos brancos em diferentes opacidades, sem imagens, planos preenchidos ou WebGL. A geometria do canal permanece estável; as texturas se deslocam com a correnteza.

### Sequência do rio

1. Somente após o loader desaparecer: uma gota pequena, centralizada no eixo horizontal, cai por 0,95 s até o centro da tela.
2. O impacto solta um pequeno respingo e uma frente circular em ASCII. A frente revela o canal de dentro para fora durante 1,85 s.
3. A onda passa e deixa a água fluindo: linhas acompanham as curvas do canal, cristas viajam pela superfície e pontos de espuma percorrem as margens. Sem movimento do mouse ou elementos novos de interface.


## Movimento reduzido

A logo inicial permanece na fonte oficial. O cabeçalho e o rio aparecem após uma breve espera, sem coreografia de entrada, queda ou onda. O rio fica estático; a preferência também é respeitada quando muda durante a sessão. Os controles mantêm foco visível.

## Implementação

React, TypeScript, Vite e GSAP. Geist Mono local. O catálogo de tte.js fornece os efeitos da abertura em um Canvas temporário, destruído ao terminar ou desmontar o componente. `AsciiRiver` controla um Canvas 2D independente: arrays tipados para a grade, atlas de glifos e atualização visual limitada a 30 fps. O loop para quando a aba fica oculta ou o usuário pede movimento reduzido; desmontar remove o frame pendente e os listeners. As variantes FIGlet permanecem apenas nas interações da logo do cabeçalho. Sem dependência da cena Dragons experimental e sem Three.js / React Three Fiber. Nenhuma nova seção ou informação pessoal foi adicionada.
