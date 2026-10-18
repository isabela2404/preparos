# Caderno de Preparos

App de celular (PWA) para planejar preparos, gerar a lista de compras e consultar receitas. Especificação em [docs/visao-produto-requisitos.md](docs/visao-produto-requisitos.md).

## Rodar no computador

```sh
npm install
npm run dev      # abre em http://localhost:5173
npm test         # testes das regras e checagem do catálogo
```

## Publicar

1. No GitHub, em Settings → Pages → Build and deployment, escolha a origem **GitHub Actions**.
2. Cada push na branch `main` roda os testes e publica o app.

## Editar receitas

Por enquanto as receitas ficam em [src/dados/carga-inicial.json](src/dados/carga-inicial.json). Cada ingrediente da receita precisa existir no catálogo `ingredientes`, e as quantidades são sempre para **uma** porção, na unidade base (g, ml ou un). `npm test` avisa se algum código de ingrediente não existir no catálogo.
