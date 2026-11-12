# Gianlucca Claudino — portfolio

Tela preta com cabeçalho e abertura ASCII. O hero, o baralho e a cena 3D foram removidos a pedido do dono.

## Experiência atual

- A logo `lvsk` cicla fontes FIGlet no centro por aproximadamente 3 s, incluindo resolução l→k e pausa.
- A abertura desaparece e o cabeçalho entra com a logo à esquerda e Projects / Contact à direita.
- Hovers e foco do cabeçalho preservados: onda de fontes na logo, scramble, sublinhado espectral e atração magnética nos links.
- Após a abertura, o restante da tela é preto puro, sem grão, hero, objetos ou canvas.
- Movimento reduzido: logo inicial estática, sem ciclo de fontes; depois aparece o cabeçalho.

React 19 + TypeScript + Vite; GSAP para a entrada do cabeçalho e Geist Mono local. Sem Three.js ou React Three Fiber.

## Executar

Node.js 22.12+.

```sh
npm install
npm run dev
```

## Produção

```sh
npm run build
npm run preview
```

`npm run typecheck` executa apenas o TypeScript. `npm run glyphs` regenera as variantes por letra usadas no loader e no cabeçalho.

`?intro=0` pula a abertura. Os antigos parâmetros de cena (`debug`, `t`, `webgl`) foram removidos.

Projects e Contact continuam links mock, sem seções de destino. Os arquivos independentes da capa do GitHub em `github-profile/` não foram alterados.

## Verificação

Build de produção concluído. Abertura, hovers, foco por teclado, mobile emulado e movimento reduzido exercitados no Chromium, sem erros de console. Capturas confirmaram pixels #000000 abaixo do cabeçalho e ausência de hero/canvas.
