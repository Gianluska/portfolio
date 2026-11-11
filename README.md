# Gianlucca Claudino — portfolio

Hero editorial com foco no nome e na atuação profissional. Logo ASCII no header; intro com fontes FIGlet e baralho 3D escuro. Sem escultura da marca ou seletor de fontes. Direção em [`DESIGN.md`](DESIGN.md) e implementação em [`PLAN.md`](PLAN.md).

React 19 + TypeScript + Vite + React Three Fiber. Geist e Geist Mono self-hosted.

## Executar

Node.js 22.12+.

```sh
npm install
npm run dev
```

## Produção

```sh
npm run build      # TypeScript + Vite
npm run preview
```

`npm run typecheck` executa apenas o TypeScript. `npm run glyphs` regenera as variantes por letra usadas no loader e no header.

## Experiência

- Nome completo em destaque e três especialidades com crossfade discreto.
- Mouse movimenta o fundo; informações permanecem imóveis.
- Movimento reduzido preserva o texto, sem ciclo automático de especialidades nem grão animado.
- Sem WebGL, o mesmo conteúdo permanece em DOM.
- Projects e Contact continuam links mock, conforme o escopo atual de header e hero.

## Depuração

| Parâmetro | Efeito |
|---|---|
| `?intro=0` | Abre direto no hero |
| `?debug` | Fase, FPS e scrub |
| `?t=1.6` | Congela o fechamento no instante indicado |
| `?webgl=0` | Força o fallback sem WebGL |
