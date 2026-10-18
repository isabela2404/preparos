import { CATEGORIAS } from '../dominio/categorias.js';

// RF-02: uma categoria por vez ou "Todas". `selecionada` null significa Todas.
export function ChipsCategoria({ selecionada, aoSelecionar }) {
  const opcoes = [{ id: null, nome: 'Todas', cor: 'var(--cor-acao)' }, ...CATEGORIAS];
  return (
    <div class="chips" role="radiogroup" aria-label="Filtrar por categoria">
      {opcoes.map((c) => (
        <button
          key={c.id ?? 'todas'}
          type="button"
          role="radio"
          aria-checked={selecionada === c.id}
          class="chip"
          style={{ '--cor-categoria': c.cor }}
          onClick={() => aoSelecionar(c.id)}
        >
          {c.nomeCurto ?? c.nome}
        </button>
      ))}
    </div>
  );
}
