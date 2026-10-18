import { useLayoutEffect } from 'preact/hooks';
import { Plus } from 'lucide-preact';
import { CampoBusca } from '../componentes/CampoBusca.jsx';
import { CardReceita } from '../componentes/CardReceita.jsx';
import { ChipsCategoria } from '../componentes/ChipsCategoria.jsx';
import { TopoTitulo } from '../componentes/TopoTitulo.jsx';
import { filtrarPorBusca } from '../dominio/busca.js';
import { filtrarPorCategoria } from '../dominio/categorias.js';

// Guarda a rolagem da galeria para que voltar de uma receita não leve ao topo.
let rolagemSalva = 0;

export function Caderno({ caderno, planejador, status, categoria, aoMudarCategoria, busca, aoMudarBusca }) {
  useLayoutEffect(() => {
    scrollTo(0, rolagemSalva);
    return () => {
      rolagemSalva = scrollY;
    };
  }, []);

  const visiveis = filtrarPorBusca(filtrarPorCategoria(caderno.receitas, categoria), caderno.ingredientes, busca);
  const voltarAoTopo = () => {
    rolagemSalva = 0;
    scrollTo(0, 0);
  };

  return (
    <>
      <header class="topo">
        <TopoTitulo titulo="Caderno de Preparos" status={status} />
        <div class="topo-busca">
          <CampoBusca
            valor={busca}
            aoMudar={(texto) => {
              voltarAoTopo();
              aoMudarBusca(texto);
            }}
          />
        </div>
        <ChipsCategoria
          selecionada={categoria}
          aoSelecionar={(id) => {
            voltarAoTopo();
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
          <p class="vazio">{busca.trim() ? `Nenhuma receita com “${busca.trim()}”.` : 'Nenhuma receita nesta categoria ainda.'}</p>
        )}
        <a class="nova-receita" href="#/nova-receita">
          <Plus size={22} aria-hidden="true" /> Nova receita
        </a>
      </main>
    </>
  );
}
