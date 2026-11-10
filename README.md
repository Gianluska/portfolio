# React Three Fiber — base

Base mínima com Vite, React, Three.js e React Three Fiber. Renderiza apenas um cubo estático e iluminado no centro de um canvas em tela cheia, sem controles ou animações.

## Executar

Com Node.js 22.12+:

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

A cena está em `src/App.jsx`; os estilos de tela cheia estão em `src/style.css`. O canvas usa `frameloop="demand"` para não renderizar continuamente uma cena estática.
