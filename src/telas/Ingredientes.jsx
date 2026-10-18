import { useState } from 'preact/hooks';
import { ArrowLeft } from 'lucide-preact';
import { Dialogo } from '../componentes/Dialogo.jsx';
import { apagarIngrediente, salvarIngrediente } from '../dados/repositorio.js';
import { NOME_UNIDADE } from '../dominio/edicao.js';
import { SETORES } from '../dominio/setores.js';
import { voltar } from '../rotas.js';

// Catálogo de ingredientes (RN-02, RN-05): corrigir nome, setor e item de
// despensa. A unidade não muda, porque as quantidades das receitas dependem dela.
export function Ingredientes({ caderno, podeEditar }) {
  const [editando, setEditando] = useState(null);

  const usos = {};
  for (const r of caderno.receitas)
    for (const i of r.ingredientes) usos[i.ingrediente] = (usos[i.ingrediente] ?? 0) + 1;

  const porSetor = SETORES.map((s) => ({
    ...s,
    itens: Object.entries(caderno.ingredientes)
      .filter(([, i]) => i.setor === s.id)
      .sort(([, a], [, b]) => a.nome.localeCompare(b.nome, 'pt-BR')),
  })).filter((s) => s.itens.length);

  return (
    <main class="conteudo ajustes">
      <div class="ajustes-topo">
        <button type="button" class="botao-voltar-simples" onClick={voltar} aria-label="Voltar">
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1 class="topo-titulo">Ingredientes</h1>
      </div>
      <p class="nota">
        {podeEditar
          ? 'Toque num ingrediente para mudar o nome, o setor do mercado ou marcar como item de despensa.'
          : 'Para editar o catálogo, crie antes o código do casal em Ajustes.'}
      </p>

      {porSetor.map((setor) => (
        <section key={setor.id} class="setor">
          <h2 class="setor-titulo">{setor.nome}</h2>
          <ul class="itens">
            {setor.itens.map(([codigo, ing]) => (
              <li key={codigo}>
                <button type="button" class="catalogo-item" disabled={!podeEditar} onClick={() => setEditando(codigo)}>
                  <span>
                    {ing.nome}
                    <small>
                      {usos[codigo] ? `${usos[codigo]} ${usos[codigo] === 1 ? 'receita' : 'receitas'}` : 'sem uso'}
                      {ing.basico ? ' · despensa' : ''}
                    </small>
                  </span>
                  <span class="catalogo-unidade">{NOME_UNIDADE[ing.unidade]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Dialogo aberto={editando != null} aoFechar={() => setEditando(null)} rotulo="Editar ingrediente">
        {editando && (
          <EditarIngrediente
            codigo={editando}
            ingrediente={caderno.ingredientes[editando]}
            usos={usos[editando] ?? 0}
            aoFechar={() => setEditando(null)}
          />
        )}
      </Dialogo>
    </main>
  );
}

function EditarIngrediente({ codigo, ingrediente, usos, aoFechar }) {
  const [dados, setDados] = useState({
    nome: ingrediente.nome,
    setor: ingrediente.setor,
    basico: Boolean(ingrediente.basico),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!dados.nome.trim()) return;
        const { basico: _, ...resto } = ingrediente;
        salvarIngrediente(codigo, {
          ...resto,
          nome: dados.nome.trim(),
          setor: dados.setor,
          ...(dados.basico && { basico: true }),
        });
        aoFechar();
      }}
    >
      <h2>Editar ingrediente</h2>
      <label class="campo">
        <span>Nome</span>
        <input
          type="text"
          value={dados.nome}
          onInput={(e) => {
            const valor = e.currentTarget.value;
            setDados((atual) => ({ ...atual, nome: valor }));
          }}
        />
      </label>
      <label class="campo">
        <span>Setor do mercado</span>
        <select
          value={dados.setor}
          onChange={(e) => {
            const valor = e.currentTarget.value;
            setDados((atual) => ({ ...atual, setor: valor }));
          }}
        >
          {SETORES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </label>
      <label class="opcao">
        <input
          type="checkbox"
          checked={dados.basico}
          onChange={(e) => {
            const valor = e.currentTarget.checked;
            setDados((atual) => ({ ...atual, basico: valor }));
          }}
        />
        <span>Item de despensa (vai para "Confira na despensa")</span>
      </label>
      <p class="nota">Medido em {NOME_UNIDADE[ingrediente.unidade]}. A unidade não muda.</p>
      <div class="confirmacao-acoes">
        {usos === 0 && (
          <button
            type="button"
            class="botao botao-perigo-texto"
            onClick={() => {
              apagarIngrediente(codigo);
              aoFechar();
            }}
          >
            Apagar
          </button>
        )}
        <button type="button" class="botao botao-secundario" onClick={aoFechar}>
          Cancelar
        </button>
        <button type="submit" class="botao" disabled={!dados.nome.trim()}>
          Salvar
        </button>
      </div>
    </form>
  );
}
