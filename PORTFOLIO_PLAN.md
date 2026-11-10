# lvsk. — Plano do portfolio

## Brief confirmado

- Marca: **lvsk.**
- Posicionamento: **Creative Technologist**, criador de experiências web hipervisuais.
- Público prioritário: estúdios e agências.
- Idioma do site: inglês.
- Estrutura: hero 3D, trabalhos com navegação própria e contato com uma experiência diferente.
- Identidade: minimalista, séria, detalhista e inspirada no Omarchy pessoal do autor.
- Direção aprovada pelo autor e implementada na versão `0.2.0`. O histórico abaixo registra as decisões de experiência.

## Direção aprovada: ASCII / MATTER

**Uma identidade feita de caracteres que ganha presença física.** A interface mantém a disciplina de um terminal; a obra demonstra o domínio de luz, composição, movimento e programação gráfica.

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

## 1. Hero: a assinatura como escultura

### Composição

Uma cena de altura próxima ao viewport, com bastante espaço negativo. A escultura domina o campo central; a identificação permanece em HTML, discreta e legível. Logo pequena no canto superior esquerdo; links `Work` e `Contact` no direito, sem barra flutuante ou menu fullscreen.

Texto proposto:

> Creative technologist.
> I build immersive web experiences.

### Experiência principal

Os caracteres da logo tornam-se peças tridimensionais distribuídas em profundidade. Uma projeção frontal alinha essas peças para reconstruir o desenho ASCII. Fora desse alinhamento, aparecem suas extrusões, camadas e espaços internos.

O acabamento é de metal grafite acetinado com arestas claras. A luz rasante e a oclusão entre peças revelam o volume; o resultado não depende de partículas, bloom forte ou uma esfera cromada genérica.

1. A página abre com uma composição já legível e visualmente resolvida. Nenhuma introdução bloqueia a navegação.
2. Um movimento curto apresenta a profundidade e acomoda a escultura na posição de assinatura.
3. O ponteiro desloca suavemente o ponto de vista dentro de um limite pequeno, com inércia e sem prejudicar a leitura.
4. Ao rolar, a câmera abandona o alinhamento frontal. As peças revelam seu perfil e deixam espaço para o primeiro trabalho.

A anamorfose é a assinatura: uma pequena mudança de perspectiva transforma uma marca plana em arquitetura. Mesmo sem interação, o enquadramento, a luz e o material precisam sustentar o impacto.

A logo em HTML não se deforma. Sua interpretação espacial é uma obra derivada, não uma substituição da marca.

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

A troca usa um recorte em lâminas inspirado nas camadas da escultura: a mídia anterior se divide brevemente, revela profundidade e recompõe a próxima. Texto e controles respondem imediatamente; a transição visual não bloqueia seleções rápidas.

Começar com uma seleção editorial de três a cinco trabalhos, caso exista esse material. A quantidade final depende dos projetos reais, sem preencher espaços com trabalhos inventados.

### Informação por trabalho

- Nome e uma frase que explique a experiência.
- Sua contribuição específica: criação, direção, desenvolvimento ou colaboração, conforme o caso real.
- Ano e colaboradores relevantes, quando informados.
- Imagem principal ou vídeo curto.
- `Visit project` apenas quando houver um destino público válido.

Sem páginas extensas de case nesta proposta. O objetivo é permitir que uma agência reconheça rapidamente a qualidade visual e entenda o que você executou.

## 3. Contact: abrir uma conexão

A escultura retorna em escala mais próxima e suas camadas se alinham como duas superfícies separadas por uma fenda de luz. O contato nasce dessa abertura, encerrando a mesma linguagem espacial do hero.

Título proposto:

> Have something in mind?

O endereço de e-mail real fica visível em HTML, acompanhado de `Email me` e `Copy email`. Ao aproximar o ponteiro da região, as superfícies se afastam sutilmente e a luz abre o enquadramento do endereço. A experiência convida à aproximação, mas não esconde a informação.

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

1. **Identidade e enquadramento:** validar logo, tipografia, composição desktop/mobile e storyboard da anamorfose.
2. **Escultura:** construir a geometria derivada dos caracteres e resolver primeiro projeção, luz e material. Só então adicionar movimento de ponteiro e câmera.
3. **Trabalhos:** integrar mídia real, seleção acessível e transição entre projetos.
4. **Contato:** integrar endereço e links reais, abertura espacial e estados de cópia.
5. **Validação integrada:** testar a jornada inteira em desktop e mobile, teclado, movimento reduzido, carregamento lento e ausência de WebGL.

Geometria e recursos reutilizados, sem alocações recorrentes no loop de renderização. Limitar resolução e custo de efeitos em telas pequenas. Pausar renderizações quando a aba estiver oculta e invalidar frames apenas quando houver movimento ou mudança de estado.

## Critérios de aprovação

- A primeira tela comunica quem é lvsk. e já apresenta uma obra marcante, sem depender de hover ou de uma introdução longa.
- A logo ASCII é reconhecível no alinhamento principal; o deslocamento revela profundidade real.
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
