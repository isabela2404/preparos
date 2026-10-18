import { useLayoutEffect } from 'preact/hooks';
import { CardReceita } from '../componentes/CardReceita.jsx';
import { ChipsCategoria } from '../componentes/ChipsCategoria.jsx';
import { filtrarPorCategoria } from '../dominio/categorias.js';

// Guarda a rolagem da galeria para que voltar de uma receita não leve ao topo.
let rolagemSalva = 0;

export function Caderno({ receitas, planejador, categoria, aoMudarCategoria }) {
  useLayoutEffect(() => {
    scrollTo(0, rolagemSalva);
    return () => {
      rolagemSalva = scrollY;
    };
  }, []);

  const visiveis = filtrarPorCategoria(receitas, categoria);

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
                <CardReceita receita={r} porcoes={planejador[r.id]} />
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
