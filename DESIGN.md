# Direção — portfolio Gianlucca Claudino

## Prioridade

Portfolio, não demonstração da marca. O visitante deve ler o nome e entender a atuação antes de perceber os efeitos. A escultura ASCII e o seletor de fontes foram rejeitados pelo dono por repetirem `lvsk` e tirarem o foco das informações.

## Composição atual

- Nome completo em duas linhas, grande e alinhado à esquerda; sem repetir o apelido no hero.
- Especialidade imediatamente abaixo: Creative Technologist, Frontend Specialist e Product Engineer.
- Texto complementar curto: “Frontend engineering meets product & creative technology.” Sem credenciais, projetos ou disponibilidade inventados.
- Logo ASCII somente no header, além do loader existente.
- No desktop, o texto complementar ocupa o canto inferior direito; no mobile, fica abaixo da identidade, no mesmo alinhamento.

## Sistema visual

Preto, branco quente `#f2f1ee` e texto secundário `#bcbab5`. Geist regular no nome, Geist Mono na especialidade e navegação; fontes locais existentes. Sem cartões, controles de demonstração ou novos objetos 3D. Espaço vazio e contraste fazem a hierarquia.

O baralho permanece real, em React Three Fiber, escuro e discreto. Um scrim no DOM protege a leitura, sem cobrir o header. Movimento e paralaxe ficam no fundo; nome e informações não seguem o cursor.

## Movimento

A intro mantém o ciclo ASCII de aproximadamente 3 s e o fechamento do baralho. Depois, o nome entra por máscara sem giro; as informações entram em sequência. A especialidade permanece legível por aproximadamente 4,8 s antes de um crossfade monocromático. Header e links mantêm suas interações existentes.

Movimento reduzido: sem fechamento teatral, sem ciclo de especialidades e sem grão animado. Sem WebGL: a mesma hierarquia e as mesmas informações, apenas sem a cena.

## Escopo

React 19, TypeScript, Vite e React Three Fiber mantidos. Apenas intro, header e hero; Projects e Contact continuam mocks do escopo anterior. Sem páginas novas, dados de contato inventados ou projetos fictícios.
