import { useEffect } from 'preact/hooks';
import { IconeCategoria, useFoto } from '../componentes/CapaReceita.jsx';
import { BotaoZerar } from '../componentes/BotaoZerar.jsx';
import { ChipsCategoria } from '../componentes/ChipsCategoria.jsx';
import { ContadorPorcoes } from '../componentes/ContadorPorcoes.jsx';
import { TopoTitulo } from '../componentes/TopoTitulo.jsx';
import { CATEGORIA_POR_ID, filtrarPorCategoria } from '../dominio/categorias.js';
import { linkReceita } from '../rotas.js';

// RF-10 a RF-14. Só as receitas escolhidas, na ordem das categorias; a escolha
// é feita no Caderno (RF-07). O filtro mostra só as categorias que têm receita
// escolhida, e o resumo conta o que está filtrado. A lista se recalcula
// sozinha (RF-15), então não há botão de gerar.
export function Planejador({ caderno, planejador, status, categoria, aoMudarCategoria }) {
  const escolhidas = caderno.receitas.filter((r) => planejador[r.id] != null);
  const disponiveis = new Set(escolhidas.map((r) => r.categoria));
  // A categoria do filtro ficou sem receitas: volta para Todas.
  const filtro = disponiveis.has(categoria) ? categoria : null;
  useEffect(() => {
    if (categoria !== filtro) aoMudarCategoria(null);
  }, [categoria, filtro]);

  const visiveis = filtrarPorCategoria(escolhidas, filtro);
  const totalPorcoes = visiveis.reduce((soma, r) => soma + planejador[r.id], 0);
  const nomeFiltro = filtro && (CATEGORIA_POR_ID[filtro].nomeCurto ?? CATEGORIA_POR_ID[filtro].nome);

  return (
    <>
      <header class="topo">
        <TopoTitulo titulo="Planejador" status={status} />
        {escolhidas.length > 0 && (
          <ChipsCategoria selecionada={filtro} aoSelecionar={aoMudarCategoria} disponiveis={disponiveis} />
        )}
      </header>

      <main class="conteudo com-resumo">
        {visiveis.length ? (
          <ul class="planejador">
            {visiveis.map((r) => (
              <li key={r.id} class="linha-plano" style={{ '--cor-categoria': CATEGORIA_POR_ID[r.categoria]?.cor }}>
                <a class="linha-plano-alvo" href={linkReceita(r.id)}>
                  <IconePlano receita={r} />
                  <span class="linha-plano-texto">
                    <strong>{r.nome}</strong>
                    <small>1 porção = {r.descricaoPorcao}</small>
                  </span>
                </a>
                <ContadorPorcoes receita={r} porcoes={planejador[r.id]} />
              </li>
            ))}
          </ul>
        ) : (
          <div class="lista-vazia">
            <p>Nenhuma receita no planejador. Escolha no Caderno, pelo + de cada receita.</p>
            <a class="botao botao-secundario" href="#/">
              Ir para o Caderno
            </a>
          </div>
        )}
      </main>

      <div class="resumo">
        <p class="resumo-texto" aria-live="polite">
          {nomeFiltro && <small class="resumo-filtro">{nomeFiltro}</small>}
          <strong>{visiveis.length}</strong> {visiveis.length === 1 ? 'receita' : 'receitas'} ·{' '}
          <strong>{totalPorcoes}</strong> {totalPorcoes === 1 ? 'porção' : 'porções'}
        </p>
        <div class="resumo-acoes">
          <BotaoZerar desabilitado={!escolhidas.length} />
        </div>
      </div>
    </>
  );
}

// Miniatura da foto, ou o ícone da categoria.
function IconePlano({ receita }) {
  const foto = useFoto(receita);
  return (
    <span class={foto ? 'linha-plano-icone com-foto' : 'linha-plano-icone'}>
      {foto ? (
        <img src={foto} alt="" loading="lazy" decoding="async" />
      ) : (
        <IconeCategoria categoria={receita.categoria} size={22} />
      )}
    </span>
  );
}
