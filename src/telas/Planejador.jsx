import { Check, Plus } from 'lucide-preact';
import { IconeCategoria, useFoto } from '../componentes/CapaReceita.jsx';
import { ChipsCategoria } from '../componentes/ChipsCategoria.jsx';
import { BotaoZerar } from '../componentes/BotaoZerar.jsx';
import { CampoBusca } from '../componentes/CampoBusca.jsx';
import { ContadorPorcoes } from '../componentes/ContadorPorcoes.jsx';
import { TopoTitulo } from '../componentes/TopoTitulo.jsx';
import { definirPorcoes } from '../dados/repositorio.js';
import { filtrarPorBusca } from '../dominio/busca.js';
import { CATEGORIA_POR_ID, filtrarPorCategoria } from '../dominio/categorias.js';

// RF-10 a RF-14. A lista se recalcula sozinha (RF-15), então não há botão de gerar.
export function Planejador({ caderno, planejador, status, categoria, aoMudarCategoria, busca, aoMudarBusca }) {
  const { receitas } = caderno;
  const escolhidas = receitas.filter((r) => planejador[r.id] != null);
  const totalPorcoes = escolhidas.reduce((soma, r) => soma + planejador[r.id], 0);

  return (
    <>
      <header class="topo">
        <TopoTitulo titulo="Planejador" status={status} />
        <div class="topo-busca">
          <CampoBusca valor={busca} aoMudar={aoMudarBusca} />
        </div>
        <ChipsCategoria selecionada={categoria} aoSelecionar={aoMudarCategoria} />
      </header>

      <main class="conteudo com-resumo">
        <ul class="planejador">
          {filtrarPorBusca(filtrarPorCategoria(receitas, categoria), caderno.ingredientes, busca).map((r) => {
            const porcoes = planejador[r.id];
            const escolhida = porcoes != null;
            return (
              <li
                key={r.id}
                class={escolhida ? 'linha-plano escolhida' : 'linha-plano'}
                style={{ '--cor-categoria': CATEGORIA_POR_ID[r.categoria]?.cor }}
              >
                <button
                  type="button"
                  class="linha-plano-alvo"
                  aria-pressed={escolhida}
                  onClick={() => definirPorcoes(r.id, escolhida ? 0 : r.porcoesPadrao)}
                >
                  <IconePlano receita={r} escolhida={escolhida} />
                  <span class="linha-plano-texto">
                    <strong>{r.nome}</strong>
                    <small>1 porção = {r.descricaoPorcao}</small>
                  </span>
                  {!escolhida && <Plus class="linha-plano-mais" size={22} aria-hidden="true" />}
                </button>
                {escolhida && <ContadorPorcoes receita={r} porcoes={porcoes} />}
              </li>
            );
          })}
        </ul>
      </main>

      <div class="resumo">
        <p class="resumo-texto" aria-live="polite">
          <strong>{escolhidas.length}</strong> {escolhidas.length === 1 ? 'receita' : 'receitas'} ·{' '}
          <strong>{totalPorcoes}</strong> {totalPorcoes === 1 ? 'porção' : 'porções'}
        </p>
        <div class="resumo-acoes">
          <BotaoZerar desabilitado={!escolhidas.length} />
        </div>
      </div>
    </>
  );
}

// Miniatura da foto, ou o ícone da categoria; um visto quando está escolhida.
function IconePlano({ receita, escolhida }) {
  const foto = useFoto(receita);
  return (
    <span class={foto && !escolhida ? 'linha-plano-icone com-foto' : 'linha-plano-icone'}>
      {escolhida ? (
        <Check size={22} aria-hidden="true" />
      ) : foto ? (
        <img src={foto} alt="" loading="lazy" decoding="async" />
      ) : (
        <IconeCategoria categoria={receita.categoria} size={22} />
      )}
    </span>
  );
}
