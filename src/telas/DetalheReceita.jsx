import { useLayoutEffect, useState } from 'preact/hooks';
import { ArrowLeft, ChefHat, ClipboardCheck, Clock, Lightbulb, Pencil, Plus, Snowflake, Users } from 'lucide-preact';
import { CapaReceita } from '../componentes/CapaReceita.jsx';
import { ContadorPorcoes } from '../componentes/ContadorPorcoes.jsx';
import { TagCategoria } from '../componentes/TagCategoria.jsx';
import { definirPorcoes } from '../dados/repositorio.js';
import { SETOR_POR_ID } from '../dominio/setores.js';
import { formatarQuantidade } from '../dominio/unidades.js';
import { linkReceita, voltar } from '../rotas.js';

// RF-04: foto, rendimento, tempo, conservação, ingredientes por porção com o
// setor de cada um e passo a passo numerado. Na cozinha a receita inteira,
// como foi escrita, é mais fácil de seguir; por isso ela abre primeiro.
export function DetalheReceita({ receita, ingredientes, porcoes }) {
  const [porPorcao, setPorPorcao] = useState(false);
  useLayoutEffect(() => scrollTo(0, 0), [receita?.id]);

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
        <a class="botao botao-secundario botao-largo" href={`${linkReceita(receita.id)}/cozinha`}>
          <ChefHat size={22} aria-hidden="true" /> Modo cozinha
        </a>

        <section aria-labelledby="titulo-ingredientes">
          <h2 id="titulo-ingredientes" class="secao-titulo">
            Ingredientes
          </h2>
          <div class="alternador" role="group" aria-label="Mostrar ingredientes">
            <button type="button" aria-pressed={!porPorcao} onClick={() => setPorPorcao(false)}>
              Receita inteira
            </button>
            <button type="button" aria-pressed={porPorcao} onClick={() => setPorPorcao(true)}>
              Por porção
            </button>
          </div>

          {porPorcao ? (
            <ul class="ingredientes">
              {receita.ingredientes.map(({ ingrediente, qtdPorPorcao, aGosto }) => {
                const ing = ingredientes[ingrediente];
                return (
                  <li key={ingrediente} class="ingrediente">
                    <span class="ingrediente-nome">
                      {ing?.nome ?? ingrediente}
                      <small>{SETOR_POR_ID[ing?.setor]?.nome}</small>
                    </span>
                    <span class={aGosto ? 'ingrediente-qtd a-gosto' : 'ingrediente-qtd'}>
                      {aGosto ? 'a gosto' : formatarQuantidade(qtdPorPorcao, ing?.unidade)}
                    </span>
                  </li>
                );
              })}
            </ul>
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
