# Portfolio — estado da implementação

Escopo: intro, header e hero. Direção vigente em `DESIGN.md`; referência do baralho em `docs/reference-baralho.png`.

## Experiência

1. Loader preto com grão e letras ASCII independentes; ciclo livre de pelo menos 2 s, resolução l→k e pausa somam aproximadamente 3 s.
2. Baralho real de 64 lajes pentagonais fecha das bordas ao centro. A logo fica centralizada, encolhe 26% e esmaece 65%, sem giro.
3. Nome completo entra por máscara, seguido da especialidade e texto complementar. A logo aparece apenas no header, sem nova escultura no hero.
4. Três especialidades alternam com crossfade discreto a cada aproximadamente 4,8 s. Mouse afeta apenas a profundidade do fundo.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Nome, informações, navegação e cena lazy |
| `src/director.ts` | Loader, fechamento, entrada do texto e ciclo de especialidades |
| `src/components/AsciiLogo.ts` | Variantes da logo do loader e header |
| `src/components/RoleCycler.ts` | Crossfade monocromático sem alterar o layout |
| `src/scene/Pipeline.tsx` | Loop R3F, render target, composição, DPR adaptativo |
| `src/scene/DeckRig.ts` | Geometria e coreografia do baralho |
| `src/scene/shaders.ts` | Sombras analíticas, vinheta e grão |
| `scripts/build-glyphs.ts` | Variantes por letra; sem poses da antiga escultura |

Uniforms são passados ao construtor de ShaderMaterial via `args`. Stage é mutável, fora do render do React. O baralho é desenhado num render target e composto sobre o loader com alpha; o conteúdo fica em DOM acima do canvas.

## Layout e acessibilidade

- Nome e especialidade dominam o hero; texto complementar no canto inferior direito do desktop e abaixo no mobile.
- Scrim protege o texto, header tem camada própria. O conteúdo não acompanha o ponteiro.
- Skip link e foco visível; nome e funções disponíveis como texto acessível.
- Movimento reduzido mantém a especialidade inicial e congela o grão.
- Sem WebGL ou carregamento acima de 10 s: conteúdo em DOM, sem objeto substituto ou repetição da logo.

## Executar e depurar

`npm run dev`; `npm run build` executa TypeScript e build; `npm run preview` serve produção.

- `?intro=0`: estado final.
- `?debug`: fase, FPS e scrub.
- `?t=1.6`: congela fechamento.
- `?webgl=0`: fallback DOM.

## Limites do escopo

Projects e Contact continuam como navegação mock, sem destinos reais. Não foram adicionadas informações pessoais, credenciais, projetos ou contatos não fornecidos.
