# Caderno de Preparos

PWA gratuito e privado para um casal planejar preparos de 15 dias, gerar a lista de compras por setor do supermercado e consultar receitas na cozinha.

A especificação completa está em [docs/visao-produto-requisitos.md](docs/visao-produto-requisitos.md). Os requisitos são citados pelos códigos RF-xx, RN-xx e RNF-xx desse documento.

## Decisões já tomadas

- Hospedagem: site estático no GitHub Pages, com repositório público, nome discreto e sem divulgação. Nenhuma chave ou senha entra no repositório.
- Sincronização: Firebase Firestore no plano Spark, na conta Gmail da Pessoa A. Fica atrás de uma camada fina e trocável (RNF-09).
- Sem login: um "código do casal" longo e aleatório é o endereço do documento no banco. O segundo aparelho recebe o código por link ou QR code na tela de Ajustes.
- Receitas e catálogo de ingredientes ficam no banco. Um JSON de carga inicial no repositório popula o banco e serve de cópia de segurança.
- A lista de compras nunca é gravada: é recalculada a partir do planejador em cada aparelho. Só as marcações e os itens avulsos vão para o banco.
- São seis categorias. Café da manhã faz parte de Lanches Rápidos.
- Fotos: na versão 1, ícone da categoria sobre a cor dela. Depois, fotos em WebP de até 100 KB numa pasta do repositório, nunca no Firebase Storage.
- Idioma: português do Brasil, unidades métricas, vírgula decimal.
- Stack: Vite + Preact 10, vite-plugin-pwa (Workbox) e ícones lucide-preact. Fontes Bricolage Grotesque (títulos) e Figtree (texto) via Fontsource, empacotadas no build para funcionar offline.
- Rotas por hash (`#/receita/<id>`), porque o GitHub Pages não redireciona caminhos para o index.html.
- O GitHub Actions publica no Pages a cada push na main e roda os testes antes.

## Estrutura e comandos

- `src/dominio/`: regras puras, testadas com Vitest (categorias, setores, unidades RN-03/RN-04, validação da carga RN-02, cálculo e agrupamento da lista RN-01 a RN-10).
- `src/dados/repositorio.js`: a camada de dados trocável (RNF-09). As telas só leem e gravam por ela. Hoje o caderno vem de `carga-inicial.json` e o estado (planejador e marcações) fica no localStorage; cada operação mexe num campo só, como o Firestore fará na fase 3.
- `src/dados/carga-inicial.json`: a carga inicial do casal (29 receitas, 58 ingredientes). Traz também as listas de categorias e setores, que precisam usar os mesmos códigos de `src/dominio/`, e as `premissas` das conversões. O formato está na seção 8 do documento.
- `src/telas/`, `src/componentes/`: interface. Nomes de código e textos em português.
- `npm run dev`, `npm test`, `npm run build`, `npm run preview`.

## Roadmap

O trabalho segue as fases da seção 11 do documento, cada uma com um critério de pronto:

1. Caderno: PWA, receitas e catálogo, galeria e filtros, detalhe. Pronto quando abre offline nos dois celulares.
2. Planejador e lista: porções, soma por ingrediente, setores e checklist, WhatsApp e zerar. Pronto quando a lista confere com a conta feita à mão.
3. Sincronização: Firestore, chave do casal, gravação offline, indicador de estado. Pronto quando marcar num celular aparece no outro.

## Próximo passo

Fases 1 e 2 prontas; o app está em https://isabela2404.github.io/preparos/ (repositório isabela2404/preparos). A fase 2 só fecha quando a lista conferir com a conta feita à mão. Depois vem a fase 3: Firestore no plano Spark, código do casal (link ou QR code em Ajustes), gravação offline e indicador de estado (RF-30 a RF-34).

## Git

A assinatura deste repositório está no config local (isabela2404 com e-mail noreply do GitHub). Não usar a identidade global da máquina, que tem nome e e-mail de trabalho. O PDF em docs/ fica fora do git porque cita nomes reais.
