import { useState } from 'preact/hooks';
import { ArrowLeft, ChefHat, ClipboardCheck, Clock, Lightbulb, Pencil, Plus, Snowflake, Users } from 'lucide-preact';
import { CapaReceita } from '../componentes/CapaReceita.jsx';
import { Contador, ContadorPorcoes } from '../componentes/ContadorPorcoes.jsx';
import { TagCategoria } from '../componentes/TagCategoria.jsx';
import { definirPorcoes } from '../dados/repositorio.js';
import { ingredientesPara } from '../dominio/porcoes.js';
import { SETOR_POR_ID } from '../dominio/setores.js';
import { linkReceita, voltar } from '../rotas.js';

// RF-04: foto, rendimento, tempo, conservação, ingredientes com o setor de
// cada um e passo a passo numerado. RF-05: os ingredientes podem ser vistos
// para outro número de porções, sem mexer no planejador. A vista abre com as
// porções do planejador, quando a receita está nele.
export function DetalheReceita({ receita, ingredientes, porcoes }) {
  const padrao = receita?.porcoesPadrao ?? 1;
  const [vista, setVista] = useState(porcoes ?? padrao);
  // A receita original já serve quando a vista está no rendimento padrão.
  const [ajustando, setAjustando] = useState(vista !== padrao);

  if (!receita) {
    return (
      <main class="conteudo vazio">
        <p>Receita não encontrada.</p>
        <a class="botao" href="#/">
          Ir para o Caderno
        </a>
      </main>
    );
  }

  const conservacao = Object.entries(receita.conservacao ?? {});

  return (
    <main class="detalhe">
      <div class="detalhe-capa">
        <CapaReceita receita={receita} />
        <button type="button" class="botao-voltar" onClick={voltar} aria-label="Voltar">
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <a class="botao-editar" href={`${linkReceita(receita.id)}/editar`} aria-label="Editar receita">
          <Pencil size={22} aria-hidden="true" />
        </a>
      </div>

      <div class="detalhe-corpo">
        <TagCategoria categoria={receita.categoria} />
        <h1 class="detalhe-nome">{receita.nome}</h1>

        <ul class="detalhe-info">
          <li>
            <Clock size={20} aria-hidden="true" /> {receita.tempo}
          </li>
          <li>
            <Users size={20} aria-hidden="true" />
            <span>
              Rende {receita.porcoesPadrao} {receita.porcoesPadrao === 1 ? 'porção' : 'porções'}
              {receita.descricaoPorcao && <small>1 porção = {receita.descricaoPorcao}</small>}
            </span>
          </li>
          {conservacao.length > 0 && (
            <li>
              <Snowflake size={20} aria-hidden="true" />
              <span>{conservacao.map(([local, prazo]) => `${local}: ${prazo}`).join(' · ')}</span>
            </li>
          )}
        </ul>

        {/* RF-07 */}
        {porcoes == null ? (
          <button
            type="button"
            class="botao botao-largo"
            onClick={() => definirPorcoes(receita.id, receita.porcoesPadrao)}
          >
            <Plus size={22} aria-hidden="true" /> Adicionar ao planejador
          </button>
        ) : (
          <div class="no-planejador">
            <span>
              <ClipboardCheck size={22} aria-hidden="true" /> No planejador
            </span>
            <ContadorPorcoes receita={receita} porcoes={porcoes} />
          </div>
        )}

        {/* RF-06 */}
        <a
          class="botao botao-secundario botao-largo"
          href={`${linkReceita(receita.id)}/cozinha${ajustando && vista !== padrao ? `/${vista}` : ''}`}
        >
          <ChefHat size={22} aria-hidden="true" /> Modo cozinha
        </a>

        <section aria-labelledby="titulo-ingredientes">
          <h2 id="titulo-ingredientes" class="secao-titulo">
            Ingredientes
          </h2>
          <div class="alternador" role="group" aria-label="Mostrar ingredientes">
            <button type="button" aria-pressed={!ajustando} onClick={() => setAjustando(false)}>
              Receita original
            </button>
            <button type="button" aria-pressed={ajustando} onClick={() => setAjustando(true)}>
              Ajustar porções
            </button>
          </div>

          {ajustando ? (
            <>
              <div class="vista-porcoes">
                <span>Para</span>
                <Contador
                  valor={vista}
                  rotulo="Porções para ver a receita"
                  aoMudar={(delta) => setVista((atual) => Math.min(99, Math.max(1, atual + delta)))}
                />
                <span>{vista === 1 ? 'porção' : 'porções'}</span>
              </div>
              <p class="nota vista-nota">A receita original rende {padrao}. Isto não muda o planejador nem a lista.</p>
              <ul class="ingredientes">
                {ingredientesPara(receita, ingredientes, vista).map((i) => (
                  <li key={i.codigo} class="ingrediente">
                    <span class="ingrediente-nome">
                      {i.nome}
                      <small>{SETOR_POR_ID[i.setor]?.nome}</small>
                    </span>
                    <span class={i.quantidade === 'a gosto' ? 'ingrediente-qtd a-gosto' : 'ingrediente-qtd'}>
                      {i.quantidade}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ul class="ingredientes">
              {receita.ingredientesTexto.map((linha, i) => (
                <li key={i} class="ingrediente">
                  {linha}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-passos">
          <h2 id="titulo-passos" class="secao-titulo">
            Modo de preparo
          </h2>
          <ol class="passos">
            {receita.passos.map((passo, i) => (
              <li key={i}>{passo}</li>
            ))}
          </ol>
        </section>

        {receita.vira && (
          <p class="vira">
            <Lightbulb size={22} aria-hidden="true" />
            <span>
              <strong>Vira: </strong>
              {receita.vira}
            </span>
          </p>
        )}
      </div>
    </main>
  );
}
