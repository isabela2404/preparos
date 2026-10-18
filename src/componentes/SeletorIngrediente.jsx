import { useState } from 'preact/hooks';
import { Plus, X } from 'lucide-preact';
import { normalizar } from '../dominio/busca.js';
import { gerarId } from '../dominio/edicao.js';
import { SETORES, SETOR_POR_ID } from '../dominio/setores.js';
import { Dialogo } from './Dialogo.jsx';

const UNIDADES = [
  { id: 'g', nome: 'Peso (g)' },
  { id: 'ml', nome: 'Volume (ml)' },
  { id: 'un', nome: 'Unidades' },
];

/**
 * Escolhe um ingrediente do catálogo ou cria um novo (RN-02: um código por
 * ingrediente). `aoEscolher(codigo, novoIngrediente?)`.
 */
export function SeletorIngrediente({ aberto, ingredientes, aoEscolher, aoFechar }) {
  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} rotulo="Escolher ingrediente" class="seletor">
      <Conteudo ingredientes={ingredientes} aoEscolher={aoEscolher} aoFechar={aoFechar} />
    </Dialogo>
  );
}

// Separado para o estado zerar cada vez que o diálogo abre.
function Conteudo({ ingredientes, aoEscolher, aoFechar }) {
  const [busca, setBusca] = useState('');
  const [novo, setNovo] = useState(null);

  if (novo) {
    return (
      <form
        class="seletor-novo"
        onSubmit={(e) => {
          e.preventDefault();
          const nome = novo.nome.trim();
          if (!nome) return;
          const codigo = gerarId(nome, new Set(Object.keys(ingredientes)));
          const ingrediente = { nome, unidade: novo.unidade, setor: novo.setor, medidas: {} };
          if (novo.basico) ingrediente.basico = true;
          aoEscolher(codigo, ingrediente);
        }}
      >
        <h2>Novo ingrediente</h2>
        <label class="campo">
          <span>Nome</span>
          <input
            type="text"
            value={novo.nome}
            onInput={(e) => {
              const valor = e.currentTarget.value;
              setNovo((atual) => ({ ...atual, nome: valor }));
            }}
          />
        </label>
        <fieldset class="campo">
          <legend>Como se mede</legend>
          <div class="opcoes">
            {UNIDADES.map((u) => (
              <label key={u.id} class="opcao">
                <input
                  type="radio"
                  name="unidade"
                  checked={novo.unidade === u.id}
                  onChange={() => setNovo((atual) => ({ ...atual, unidade: u.id }))}
                />
                <span>{u.nome}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label class="campo">
          <span>Setor do mercado</span>
          <select
            value={novo.setor}
            onChange={(e) => {
              const valor = e.currentTarget.value;
              setNovo((atual) => ({ ...atual, setor: valor }));
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
            checked={novo.basico}
            onChange={(e) => {
              const valor = e.currentTarget.checked;
              setNovo((atual) => ({ ...atual, basico: valor }));
            }}
          />
          <span>Item de despensa, como sal e pimenta</span>
        </label>
        <div class="confirmacao-acoes">
          <button type="button" class="botao botao-secundario" onClick={() => setNovo(null)}>
            Voltar
          </button>
          <button type="submit" class="botao" disabled={!novo.nome.trim()}>
            Criar
          </button>
        </div>
      </form>
    );
  }

  const termo = normalizar(busca.trim());
  const opcoes = Object.entries(ingredientes)
    .filter(([, i]) => normalizar(i.nome).includes(termo))
    .sort(([, a], [, b]) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const existeIgual = opcoes.some(([, i]) => normalizar(i.nome) === termo);

  return (
    <>
      <div class="seletor-topo">
        <h2>Ingrediente</h2>
        <button type="button" class="botao-voltar-simples" onClick={aoFechar} aria-label="Fechar">
          <X size={24} aria-hidden="true" />
        </button>
      </div>
      <input
        type="search"
        class="seletor-busca"
        placeholder="Buscar ou criar ingrediente"
        aria-label="Buscar ingrediente"
        value={busca}
        onInput={(e) => setBusca(e.currentTarget.value)}
      />
      {busca.trim() && !existeIgual && (
        <button
          type="button"
          class="botao botao-secundario seletor-criar"
          onClick={() => setNovo({ nome: busca.trim(), unidade: 'g', setor: 'hortifruti', basico: false })}
        >
          <Plus size={20} aria-hidden="true" /> Criar “{busca.trim()}”
        </button>
      )}
      <ul class="seletor-lista">
        {opcoes.map(([codigo, i]) => (
          <li key={codigo}>
            <button type="button" onClick={() => aoEscolher(codigo)}>
              <span>{i.nome}</span>
              <small>{SETOR_POR_ID[i.setor]?.nome}</small>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
