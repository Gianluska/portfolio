# Direção — portfolio Gianlucca Claudino

## Escopo vigente

Manter apenas o cabeçalho e a animação inicial da logo `lvsk`. Após a abertura, a tela permanece preta, sem hero, baralho, prisma, escultura, textos de apresentação ou outros elementos visuais.

## Elementos preservados

- Logo ASCII em células fixas, com fontes FIGlet independentes durante a abertura.
- Ciclo livre de 2 s, resolução l→k e pausa: aproximadamente 3 s antes da transição.
- Logo no topo esquerdo e Projects / Contact no topo direito.
- Entrada do cabeçalho e interações existentes de hover/foco, sem redesenho.

## Fundo

#000000. O grão pertence apenas ao loader e desaparece com ele. Não há canvas, textura, paralaxe ou loop de render após a abertura.

## Movimento reduzido

A logo inicial permanece na fonte oficial, sem ciclo. O cabeçalho aparece após uma breve espera, sem coreografia de entrada. Os controles mantêm foco visível.

## Implementação

React, TypeScript, Vite e GSAP. Geist Mono local. A cena 3D, seu estado, shaders, controle de ponteiro e dependências Three.js / React Three Fiber foram removidos. Nenhuma nova seção ou informação pessoal foi adicionada.
