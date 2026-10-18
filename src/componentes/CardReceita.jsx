import { Check, Clock, Plus, Users } from 'lucide-preact';
import { definirPorcoes } from '../dados/repositorio.js';
import { linkReceita } from '../rotas.js';
import { CapaReceita } from './CapaReceita.jsx';
import { TagCategoria } from './TagCategoria.jsx';

// O card inteiro abre a receita; o botão redondo põe ou tira do planejador (RF-07).
export function CardReceita({ receita, porcoes }) {
  const noPlanejador = porcoes != null;
  return (
    <article class="card">
      <CapaReceita receita={receita} />
      <div class="card-corpo">
        <TagCategoria categoria={receita.categoria} curta />
        <h2 class="card-nome">
          <a class="card-link" href={linkReceita(receita.id)}>
            {receita.nome}
          </a>
        </h2>
        <p class="card-meta">
          <span>
            <Clock size={16} aria-hidden="true" /> {receita.tempo}
          </span>
          <span>
            <Users size={16} aria-hidden="true" /> {porcoes ?? receita.porcoesPadrao}
            <span class="so-leitor"> porções</span>
          </span>
        </p>
      </div>
      <button
        type="button"
        class="botao-redondo"
        aria-pressed={noPlanejador}
        aria-label={noPlanejador ? `Tirar ${receita.nome} do planejador` : `Adicionar ${receita.nome} ao planejador`}
        onClick={() => definirPorcoes(receita.id, noPlanejador ? 0 : receita.porcoesPadrao)}
      >
        {noPlanejador ? <Check size={24} aria-hidden="true" /> : <Plus size={24} aria-hidden="true" />}
      </button>
    </article>
  );
}
