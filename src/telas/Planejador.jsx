import { useState } from 'preact/hooks';
import { Check, Plus } from 'lucide-preact';
import { IconeCategoria } from '../componentes/CapaReceita.jsx';
import { ChipsCategoria } from '../componentes/ChipsCategoria.jsx';
import { Confirmacao } from '../componentes/Confirmacao.jsx';
import { ContadorPorcoes } from '../componentes/ContadorPorcoes.jsx';
import { TopoTitulo } from '../componentes/TopoTitulo.jsx';
import { definirPorcoes, zerarPlanejador } from '../dados/repositorio.js';
import { CATEGORIA_POR_ID, filtrarPorCategoria } from '../dominio/categorias.js';

// RF-10 a RF-15.
export function Planejador({ receitas, planejador, status, categoria, aoMudarCategoria }) {
  const [confirmando, setConfirmando] = useState(false);

  const escolhidas = receitas.filter((r) => planejador[r.id] != null);
  const totalPorcoes = escolhidas.reduce((soma, r) => soma + planejador[r.id], 0);

  return (
    <>
      <header class="topo">
        <TopoTitulo titulo="Planejador" status={status} />
        <ChipsCategoria selecionada={categoria} aoSelecionar={aoMudarCategoria} />
      </header>

      <main class="conteudo com-resumo">
        <ul class="planejador">
          {filtrarPorCategoria(receitas, categoria).map((r) => {
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
                  <span class="linha-plano-icone">
                    {escolhida ? (
                      <Check size={22} aria-hidden="true" />
                    ) : (
                      <IconeCategoria categoria={r.categoria} size={22} />
                    )}
                  </span>
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
          <button
            type="button"
            class="botao botao-secundario"
            disabled={!escolhidas.length}
            onClick={() => setConfirmando(true)}
          >
            Zerar
          </button>
          <a class={escolhidas.length ? 'botao' : 'botao desabilitado'} href="#/lista">
            Gerar lista
          </a>
        </div>
      </div>

      <Confirmacao
        aberta={confirmando}
        titulo="Zerar o planejador?"
        texto="As receitas escolhidas e as porções serão apagadas, e a lista de compras fica vazia."
        rotuloConfirmar="Zerar planejador"
        aoConfirmar={() => {
          zerarPlanejador();
          setConfirmando(false);
        }}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
