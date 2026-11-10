# lvsk. — Plano do portfolio

## Brief confirmado

- Marca: **lvsk.**
- Posicionamento: **Creative Technologist**, criador de experiências web hipervisuais.
- Público prioritário: estúdios e agências.
- Idioma do site: inglês.
- Estrutura: hero 3D, trabalhos com navegação própria e contato com uma experiência diferente.
- Identidade: minimalista, séria, detalhista e inspirada no Omarchy pessoal do autor.
- A logo e a forma 3D foram aprovadas pelo autor. A versão `0.4.0` preserva ambas e acrescenta coreografia, abertura interativa e transições coordenadas.

## Direção atual: Optical aperture

**Uma interface silenciosa diante de uma construção espacial autoral.** A logo ASCII permanece plana; a experiência 3D demonstra composição, material, luz e interação sem transformar os caracteres em peças desconectadas.

A proposta não é reproduzir um desktop ou montar um terminal fictício. É levar a precisão do ambiente pessoal para uma experiência espacial autoral.

### Identidade visual

A referência local verificada usa fundo preto, texto branco e JetBrainsMono Nerd Font. Para a web:

- Preto como fundo contínuo; branco e cinzas neutros para texto, luz e materiais. Nenhuma cor de destaque obrigatória.
- JetBrains Mono auto-hospedada, preservando a métrica da logo e usando apenas os pesos necessários.
- Logo ASCII original em texto, com espaços, barras e quebras preservados. Sem o sufixo `OS` presente no arquivo do desktop.
- Formas retas, controles pequenos mas legíveis, espaçamento generoso e divisórias apenas quando organizam informação.
- Sem cards decorativos, badges, métricas fictícias, relógio, janela de terminal, estética Matrix ou glow neon.
- Cursor nativo. O movimento pertence à obra, não a um cursor customizado que atrapalha os links.

Logo de referência:

```text
 |               |
 | \ \   /  __|  |  /
 |  \ \ / \__ \    <
_|   \_/  ____/ _|\_\
```

## Referências pesquisadas

- [Lusion](https://lusion.co/): separação entre interface legível e uma cena com materiais, oclusão e volumes marcantes.
- [Unseen Studio](https://unseen.co/): profundidade arquitetônica, aberturas e luz coerente.
- [Dennis Snellenberg](https://dennissnellenberg.com/): um elemento visual dominante, hierarquia e navegação direta.
- [Bruno Simon, case study escrito pelo autor](https://www.awwwards.com/brunos-portfolio-case-study.html): uma premissa interativa consistente, em vez de efeitos independentes.

Lusion e Unseen são referências de estúdios; Dennis e Bruno são portfolios individuais. Lusion, Unseen e Dennis foram inspecionados ao vivo pelo Playwright MCP. Nenhum modelo, imagem ou identidade dessas referências foi incorporado ao portfolio.

## 1. Hero: uma abertura arquitetônica cinética

### Composição

Uma escultura de grande escala ocupa a região central-direita no desktop. A apresentação fica no canto inferior esquerdo, com mais presença tipográfica e sem sobrepor a abertura principal. No mobile, a escultura ganha enquadramento próprio acima do texto.

A logo ASCII original fica no topo, separada da obra. `Work` e `Contact` continuam sendo links HTML diretos.

> Creative technologist.
> I build immersive web experiences.

### Experiência principal

Uma sequência de 56 molduras metálicas contínuas forma um volume curvo e torcido, atravessado por uma abertura profunda. A forma é paramétrica e instanciada: uma geometria compartilhada, não uma coleção de caracteres extrudados.

- As superfícies acetinadas e os chanfros recebem reflexos de softboxes gerados localmente.
- A sobreposição das lâminas e as faces internas estabelecem profundidade mesmo em uma imagem estática.
- Uma onda contínua percorre individualmente as 56 lâminas, alterando curvatura, espaçamento e reflexos sem girar incessantemente o objeto inteiro.
- O ponteiro intensifica uma região dessa onda. A estrutura reage localmente, não como um bloco preso ao cursor.
- `Unfold sculpture` abre a profundidade em uma sequência de lâminas; `Reassemble` refaz o caminho.
- `Pause motion` congela inclusive uma abertura interrompida. A retomada continua desse estado, sem incorporar o tempo em que a cena ficou suspensa.
- O scroll é nativo. A obra se afasta ao entrar em Work, sem prender a navegação à câmera.
- Movimento reduzido remove o loop e as interpolações; os comandos de abertura continuam disponíveis como poses estáticas. No mobile, os controles ficam abaixo da apresentação e não dependem de hover.

Não há esfera, torus padrão, nuvem de partículas, áudio automático ou reprodução de um desktop.

## 2. Work: índice de projetos, não uma grade de cards

### Navegação

Um índice compacto de projetos à esquerda e uma grande superfície de apresentação à direita. A inspiração nos workspaces do Omarchy aparece na seleção precisa e na troca de contexto, não em uma cópia literal de sua interface.

- Um projeto ativo de cada vez.
- Nomes sempre visíveis e seleção claramente indicada.
- Clique ou teclado selecionam o projeto. Hover pode indicar a ação, mas não troca incessantemente o conteúdo.
- Setas funcionam dentro do controle de seleção, sem capturar atalhos globalmente.
- A seleção atualiza nome, descrição, papel desempenhado, ano e link real.
- O projeto inicial aparece sem exigir interação.

### Tratamento visual

A imagem ou vídeo do trabalho ocupa a maior parte da seção, sem moldura de navegador, mockup de laptop ou ornamento sobre a mídia. O conteúdo real precisa ter protagonismo.

A troca usa oito persianas de imagem com dobradiças independentes, perspectiva e sombreamento. O recorte anterior revela a mídia seguinte em uma linha do tempo de até 280ms. Texto e links respondem imediatamente; seleções rápidas redirecionam o conteúdo sem reiniciar ou enfileirar a abertura. Teclado, pausa manual e movimento reduzido interrompem a decoração sem bloquear a seleção.

Começar com uma seleção editorial de três a cinco trabalhos, caso exista esse material. A quantidade final depende dos projetos reais, sem preencher espaços com trabalhos inventados.

### Informação por trabalho

- Nome e uma frase que explique a experiência.
- Sua contribuição específica: criação, direção, desenvolvimento ou colaboração, conforme o caso real.
- Ano e colaboradores relevantes, quando informados.
- Imagem principal ou vídeo curto.
- `Visit project` apenas quando houver um destino público válido.

Sem páginas extensas de case nesta proposta. O objetivo é permitir que uma agência reconheça rapidamente a qualidade visual e entenda o que você executou.

## 3. Contact: abrir uma conexão

A abertura arquitetônica se divide em dois conjuntos de lâminas e enquadra a região de contato, preservando uma área central livre para o texto. É a mesma construção do hero, não uma terceira demonstração desconectada.

Título proposto:

> Have something in mind?

O endereço real fica visível em HTML, acompanhado de `Email me` e `Copy email`. Ao aproximar o ponteiro ou focar a região, as lâminas se afastam sutilmente. O contato nunca depende de hover, WebGL ou de descobrir uma interação escondida.

- `Email me` abre o aplicativo de e-mail via `mailto:`.
- `Copy email` copia o endereço e confirma `Copied` apenas após sucesso.
- Se a cópia falhar, o endereço continua selecionável.
- Nenhuma mensagem afirma que um e-mail foi enviado.
- Sem digitar comandos, arrastar objetos ou resolver uma interação para conseguir falar com você.
- Sem formulário ou serviço de envio nesta proposta.

O rodapé contém somente a assinatura e os links profissionais reais escolhidos pelo autor.

## Ritmo e comportamento

A intensidade varia: impacto espacial no hero, atenção concentrada nos projetos, desaceleração no contato. Três momentos coordenados, não uma coleção de efeitos independentes.

- Scroll vertical nativo; sem scroll hijacking ou longos trechos presos à câmera.
- Âncoras `Work` e `Contact` permanecem utilizáveis durante as transições.
- Um único sistema de movimento, com resposta imediata nos controles e inércia apenas nos elementos espaciais.
- O mesmo objeto e a mesma iluminação conectam a página, evitando três demos desconectadas.
- Nada de som automático, textos digitados letra a letra ou preloader com progresso fictício.

## Mobile, acessibilidade e estados

- No mobile, a composição do hero é reenquadrada, não apenas reduzida. A experiência não depende de hover, giroscópio ou arrasto.
- Em Work, o preview vem acompanhado de um seletor horizontal de nomes; não se transforma em carrossel automático. A rolagem vertical da página continua livre.
- No contato, endereço e ações aparecem diretamente; o efeito espacial é complementar.
- Links, títulos e informações dos projetos ficam no DOM, fora do WebGL, com foco visível e navegação por teclado.
- Com `prefers-reduced-motion`, remover deslocamentos de câmera, parallax e transições em profundidade. Manter composição estática e feedback discreto de estado.
- Durante o carregamento, mostrar conteúdo e um poster real da cena, sem esperar pela GPU para identificar o autor ou acessar o contato.
- Sem WebGL ou após perda de contexto, preservar poster, trabalhos e contato funcionais.

## Arquitetura e ordem de execução

Manter **Vite + React + React Three Fiber + Three.js**, já presentes na base. Não introduzir Next.js, CMS ou biblioteca de componentes sem necessidade.

Um `ExperienceCanvas` persistente concentra a cena. `Hero`, `WorkIndex` e `Contact` compõem o conteúdo HTML. Dados dos projetos ficam separados da apresentação. A navegação funciona mesmo quando o canvas não inicializa.

1. **Identidade e enquadramento:** preservar logo e tipografia, com composição própria para desktop e mobile.
2. **Escultura:** resolver geometria paramétrica, instanciamento, softboxes, material e luz antes do movimento.
3. **Trabalhos:** integrar mídia real, seleção acessível e transição entre projetos.
4. **Contato:** integrar endereço e links reais, abertura espacial e estados de cópia.
5. **Validação integrada:** testar a jornada inteira em desktop e mobile, teclado, movimento reduzido, carregamento lento e ausência de WebGL.

Geometria e recursos reutilizados, sem alocações recorrentes no loop de renderização. A onda avança apenas enquanto a escultura está visível e o movimento está permitido. Pausa, aba oculta e Work suspendem o ciclo; a retomada preserva a fase. O movimento usa deltas limitados para evitar saltos e manter o ritmo independente da taxa de quadros.

## Critérios de aprovação

- A primeira tela comunica quem é lvsk. e já apresenta uma obra marcante, sem depender de hover ou de uma introdução longa.
- A logo ASCII permanece legível no cabeçalho; a obra 3D tem identidade própria e profundidade visível sem interação.
- Cada projeto tem apresentação visual forte e contribuição autoral explícita.
- Navegação e contato permanecem óbvios, rápidos e disponíveis fora do canvas.
- Transições podem ser interrompidas sem estados quebrados ou bloqueio de entrada.
- Monocromia preserva contraste e hierarquia, sem texto importante em cinza ilegível.
- Metas a medir, não resultados já obtidos: LCP até 2,5 s, INP abaixo de 200 ms, CLS até 0,1 e animação próxima de 60 fps no desktop de referência. Verificar custo e fluidez separadamente em mobile real.

## Conteúdo integrado

- Seleção inicial de projetos públicos autorais: Grass experiment, lvsk-calendar e BTConverter, com mídia real e créditos de co-desenvolvimento quando aplicáveis.
- E-mail e links profissionais extraídos do README público do perfil GitHub do autor.
- Origens e licenças das mídias registradas em `public/work/provenance.json`.

Não foram inventados projetos, clientes, métricas, atribuições de autoria ou endereços de contato.
