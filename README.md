# Caderno de Preparos

App de celular (PWA) para planejar preparos, gerar a lista de compras e consultar receitas. Especificação em [docs/visao-produto-requisitos.md](docs/visao-produto-requisitos.md).

## Rodar no computador

```sh
npm install
npm run dev      # abre em http://localhost:5173
npm test         # testes das regras e checagem do catálogo
npm run test:regras  # regras de segurança do Firestore no emulador (precisa de Java 21)
```

Sem as variáveis do Firebase o app roda só no aparelho. Para testar a sincronização, copie `.env.exemplo` para `.env.local` e preencha.

## Publicar

1. No GitHub, em Settings → Pages → Build and deployment, escolha a origem **GitHub Actions**.
2. Em Settings → Secrets and variables → Actions → Variables, cadastre `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID` e `FIREBASE_APP_ID` (configuração do app web no console do Firebase).
3. Cada push na branch `main` roda os testes e publica o app.

As regras de segurança do banco ficam em [firestore.rules](firestore.rules) e são publicadas com `npx firebase deploy --only firestore:rules --project <id-do-projeto>`.

## Editar receitas

Por enquanto as receitas ficam em [src/dados/carga-inicial.json](src/dados/carga-inicial.json). Depois de mudar o arquivo, aumente o número em `versao`: na próxima vez que um celular sincronizado abrir o app, ele regrava as receitas e os ingredientes no banco. Cada ingrediente da receita precisa existir no catálogo `ingredientes`, e as quantidades são sempre para **uma** porção, na unidade base (g, ml ou un). `npm test` avisa se algum código de ingrediente não existir no catálogo.
