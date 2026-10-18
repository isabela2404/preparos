import { useLayoutEffect } from 'preact/hooks';
import { CardReceita } from '../componentes/CardReceita.jsx';
import { ChipsCategoria } from '../componentes/ChipsCategoria.jsx';
import { CATEGORIAS } from '../dominio/categorias.js';

const ORDEM_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c, i) => [c.id, i]));

// Guarda a rolagem da galeria para que voltar de uma receita não leve ao topo.
let rolagemSalva = 0;

export function Caderno({ receitas, categoria, aoMudarCategoria }) {
  useLayoutEffect(() => {
    scrollTo(0, rolagemSalva);
    return () => {
      rolagemSalva = scrollY;
    };
  }, []);

  const visiveis = categoria
    ? receitas.filter((r) => r.categoria === categoria)
    : // Agrupa por categoria; dentro dela, vale a ordem da carga (sort é estável).
      receitas.toSorted((a, b) => ORDEM_CATEGORIA[a.categoria] - ORDEM_CATEGORIA[b.categoria]);

  return (
    <>
      <header class="topo">
        <h1 class="topo-titulo">Caderno de Preparos</h1>
        <ChipsCategoria
          selecionada={categoria}
          aoSelecionar={(id) => {
            rolagemSalva = 0;
            scrollTo(0, 0);
            aoMudarCategoria(id);
          }}
        />
      </header>
      <main class="conteudo">
        {visiveis.length ? (
          <ul class="galeria">
            {visiveis.map((r) => (
              <li key={r.id}>
                <CardReceita receita={r} />
              </li>
            ))}
          </ul>
        ) : (
          <p class="vazio">Nenhuma receita nesta categoria ainda.</p>
        )}
      </main>
    </>
  );
}
