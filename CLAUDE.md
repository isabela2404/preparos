# Caderno de Preparos

PWA gratuito e privado para um casal planejar preparos de 15 dias, gerar a lista de compras por setor do supermercado e consultar receitas na cozinha.

A especificação completa está em [docs/visao-produto-requisitos.md](docs/visao-produto-requisitos.md). Os requisitos são citados pelos códigos RF-xx, RN-xx e RNF-xx desse documento.

## Decisões já tomadas

- Hospedagem: site estático no GitHub Pages, com repositório público, nome discreto e sem divulgação. Nenhuma chave ou senha entra no repositório.
- Sincronização: Firebase Firestore no plano Spark, na conta Gmail da Pessoa A. Fica atrás de uma camada fina e trocável (RNF-09).
- Sem login: um "código do casal" longo e aleatório é o endereço do documento no banco. O segundo aparelho recebe o código por link ou QR code na tela de Ajustes.
- Receitas e catálogo de ingredientes ficam no banco e são editados pela tela (só com código do casal). O JSON de carga inicial só popula o banco na criação do código; a cópia de segurança sai de Ajustes → Baixar cópia, no mesmo formato.
- A lista de compras nunca é gravada: é recalculada a partir do planejador em cada aparelho. Só as marcações e os itens avulsos vão para o banco.
- São seis categorias. Café da manhã faz parte de Lanches Rápidos.
- Fotos: na versão 1, ícone da categoria sobre a cor dela. Depois, fotos em WebP de até 100 KB numa pasta do repositório, nunca no Firebase Storage.
- Idioma: português do Brasil, unidades métricas, vírgula decimal.
- Stack: Vite + Preact 10, vite-plugin-pwa (Workbox) e ícones lucide-preact. Fontes Bricolage Grotesque (títulos) e Figtree (texto) via Fontsource, empacotadas no build para funcionar offline.
- Rotas por hash (`#/receita/<id>`), porque o GitHub Pages não redireciona caminhos para o index.html.
- O GitHub Actions publica no Pages a cada push na main e roda os testes antes.

## Estrutura e comandos

- `src/dominio/`: regras puras, testadas com Vitest (categorias, setores, unidades RN-03/RN-04, validação da carga RN-02, cálculo e agrupamento da lista RN-01 a RN-10).
- `src/dados/repositorio.js`: a camada de dados trocável (RNF-09). As telas só leem (`useRepositorio`) e gravam por ela. Sem código do casal, tudo fica no aparelho (carga empacotada + localStorage). Com código, `src/dados/firestore.js` é carregado por import dinâmico e passa a ser a fonte; o localStorage guarda uma cópia para abrir na hora.
- Cada operação vira uma lista de mudanças de campo (`src/dados/mudancas.js`), aplicada na hora no aparelho e enviada ao Firestore com `updateDoc` só nos campos tocados.
- Banco: `casais/{codigo}` com `planejador`, `marcados`, `avulsos` (mapa), `versaoCarga` e, depois de uma troca de código, `substituido: true` (o espaço antigo fica vazio); subcoleções `receitas` (com `ordem`) e `ingredientes`. A carga não é mais regravada depois da criação, para não apagar o que foi editado pela tela. Regras em `firestore.rules`, testadas com `npm run test:regras` (emulador, Java 21).
- Firebase: projeto `preparos-d4934`, na conta da Pessoa A. Firestore `(default)` em `southamerica-east1`, com proteção contra exclusão. Publicar regras: `npx firebase deploy --only firestore:rules --project preparos-d4934`. Atenção: `firebase deploy` cria o banco sozinho em `nam5` se ele não existir.
- Configuração do Firebase só por variáveis de ambiente (`VITE_FIREBASE_*`): `.env.local` na máquina e Variables do GitHub Actions na publicação. Nunca no código.
- `src/dados/carga-inicial.json`: a carga inicial do casal (29 receitas, 58 ingredientes). Traz também as listas de categorias e setores, que precisam usar os mesmos códigos de `src/dominio/`, e as `premissas` das conversões. O formato está na seção 8 do documento.
- `src/telas/`, `src/componentes/`: interface. Nomes de código e textos em português. Formulários atualizam o estado sempre por função (`setX((atual) => …)`), para duas mudanças seguidas não se atropelarem.
- Testes de ponta a ponta: dois Chromes headless controlados pelo protocolo de depuração contra o emulador do Firestore (build com `VITE_FIRESTORE_EMULADOR`). O emulador precisa de Java 21+; aqui usa o OpenJDK 23 do Homebrew (`JAVA_HOME=$(brew --prefix openjdk)/libexec/openjdk.jdk/Contents/Home`).
- `npm run dev`, `npm test`, `npm run build`, `npm run preview`.

## Roadmap

O trabalho segue as fases da seção 11 do documento, cada uma com um critério de pronto:

1. Caderno: PWA, receitas e catálogo, galeria e filtros, detalhe. Pronto quando abre offline nos dois celulares.
2. Planejador e lista: porções, soma por ingrediente, setores e checklist, WhatsApp e zerar. Pronto quando a lista confere com a conta feita à mão.
3. Sincronização: Firestore, chave do casal, gravação offline, indicador de estado. Pronto quando marcar num celular aparece no outro.

## Próximo passo

As fases 1, 2 e 3 do roadmap estão prontas e validadas nos dois celulares (18/10/2026). O app está em https://isabela2404.github.io/preparos/ (repositório isabela2404/preparos), sincronizando pelo Firestore.

Da etapa "Depois" já entraram: cadastro de receitas e ingredientes pela tela, busca (RF-03), porções no detalhe e no modo cozinha (RF-05), modo cozinha (RF-06), itens avulsos com grupo Outros (RF-27), origem de cada item (RF-28) e troca do código do casal. Ainda candidato: fotos das receitas.

Decidido não fazer por enquanto (18/10/2026): restringir a chave do Firebase ao domínio do Pages. Os dados já ficam protegidos pelas regras e pelo código do casal; o pior caso de abuso é a cota gratuita acabar e a sincronização parar até o dia seguinte, sem custo. Retomar só se isso acontecer.

## Git

A assinatura deste repositório está no config local (isabela2404 com e-mail noreply do GitHub). Não usar a identidade global da máquina, que tem nome e e-mail de trabalho. O PDF em docs/ fica fora do git porque cita nomes reais.
